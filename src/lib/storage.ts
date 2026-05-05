export async function uploadFile(
  _bucket: string,
  file: File,
  _customPath?: string,
) {
  try {
    // If it's not an image, just return the data URL
    if (!file.type.startsWith("image/")) {
      return new Promise<{ path: string; error: any }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ path: reader.result as string, error: null });
        };
        reader.onerror = (e) => {
          resolve({ path: "", error: e });
        };
        reader.readAsDataURL(file);
      });
    }

    // Compress image
    return new Promise<{ path: string; error: any }>((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        img.src = reader.result as string;
      };

      reader.onerror = (e) => {
        resolve({ path: "", error: e });
      };
      
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          
          // Calculate new dimensions (max 800px width/height)
          let width = img.width;
          let height = img.height;
          const MAX_DIMENSION = 800;
          
          if (width > height && width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.fillStyle = "white"; // Add white background to support transparent JPEGs if needed
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve({ path: dataUrl, error: null });
        } catch (e) {
          resolve({ path: "", error: e });
        }
      };

      img.onerror = (e) => {
        resolve({ path: "", error: e });
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error("Storage error:", error);
    return { path: null, error };
  }
}

export function getPublicUrl(_bucket: string, path: string) {
  // If it's a data URL, return it as is
  return path;
}
