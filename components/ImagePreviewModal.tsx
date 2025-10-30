import React from 'react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, imageUrl, altText = "Image Preview" }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
      aria-labelledby="image-preview-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white p-4 rounded-lg shadow-2xl max-w-4xl max-h-[90vh] transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInScale 0.3s forwards' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold leading-none shadow-lg hover:bg-gray-200 transition"
          aria-label="Close image preview"
        >
          &times;
        </button>
        <img src={imageUrl} alt={altText} className="max-w-full max-h-[85vh] object-contain" />
      </div>
    </div>
  );
};

export default ImagePreviewModal;
