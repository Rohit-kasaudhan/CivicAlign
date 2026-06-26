import React, { useState } from 'react';

const EvidenceUpload = ({ onFileSelect }) => {
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (onFileSelect) {
      onFileSelect(file);
    }

    setFileType(file.type);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Evidence (Image or Video)
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-civic-blue transition cursor-pointer relative">
        <div className="space-y-1 text-center">
          {preview ? (
            fileType.startsWith('video/') ? (
              <video src={preview} className="max-h-48 mx-auto rounded" controls />
            ) : (
              <img src={preview} alt="Evidence preview" className="max-h-48 mx-auto rounded" />
            )
          ) : (
            <>
              <span className="text-3xl">📷</span>
              <div className="flex text-sm text-gray-600">
                <span className="relative rounded-md font-semibold text-civic-blue hover:text-blue-500">
                  Upload a file
                </span>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, MP4, MOV up to 50MB</p>
            </>
          )}
          <input
            type="file"
            name="evidence"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default EvidenceUpload;
