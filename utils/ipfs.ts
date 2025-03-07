interface IPFSMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export const uploadToIPFS = async (name: string, uri: string): Promise<string> => {
  try {
    const pinataJWT = process.env.EXPO_PUBLIC_PINATA_JWT;
    if (!pinataJWT) {
      throw new Error("Pinata JWT token is not configured");
    }

    // Create form data with the correct content type
    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      type: "image/png",
      name: name.replace(" #", "-") + ".png",
    } as any);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${pinataJWT}`,
        "Accept": "application/json",
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Pinata API error:", errorText);
      throw new Error(`Failed to upload to IPFS: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return `ipfs://${data.IpfsHash}`;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
};

export const uploadMetadataToIPFS = async (name: string, metadata: IPFSMetadata): Promise<string> => {
  try {
    const pinataJWT = process.env.EXPO_PUBLIC_PINATA_JWT;
    if (!pinataJWT) {
      throw new Error("Pinata JWT token is not configured");
    }

    const prepareData = JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: name.replace(" #", "-") + ".json",
      },
    });

    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${pinataJWT}`,
        "Content-Type": "application/json",
      },
      body: prepareData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Pinata API error:", errorText);
      throw new Error(`Failed to upload metadata to IPFS: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return `ipfs://${data.IpfsHash}`;
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error);
    throw error;
  }
};
