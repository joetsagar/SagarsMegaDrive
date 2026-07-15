function uploadWithProgress(url: string, file: File, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Upload to storage failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload to storage failed"));
    xhr.send(file);
  });
}

export async function uploadFile(file: File, onProgress?: (percent: number) => void) {
  const initiateRes = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    }),
  });

  if (!initiateRes.ok) {
    const { error } = await initiateRes.json();
    throw new Error(error ?? "Failed to start upload");
  }

  const { fileId, uploadUrl } = await initiateRes.json();

  await uploadWithProgress(uploadUrl, file, onProgress ?? (() => {}));

  const confirmRes = await fetch(`/api/files/${fileId}/confirm`, { method: "POST" });
  if (!confirmRes.ok) {
    const { error } = await confirmRes.json();
    throw new Error(error ?? "Failed to confirm upload");
  }
}
