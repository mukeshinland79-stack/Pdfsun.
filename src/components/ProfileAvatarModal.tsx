import React, { useState, useRef, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Camera,
  Upload,
  ZoomIn,
  Trash2,
  Check,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { getCroppedImg, PixelCrop } from "../utils/cropImage";

export interface ProfileAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
  currentPhotoURL?: string;
  currentAvatar?: string;
  onPhotoUpdated: (newPhotoURL: string) => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ProfileAvatarModal: React.FC<ProfileAvatarModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  currentPhotoURL,
  currentAvatar,
  onPhotoUpdated,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [outputSizeKB, setOutputSizeKB] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  if (!isOpen) return null;

  const displayAvatar =
    currentPhotoURL ||
    currentAvatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg("Unsupported format. Please choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("File too large. Maximum allowed file size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setErrorMsg(null);
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read image file. Please try another.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCropped = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      setErrorMsg(null);

      // 1. Crop in canvas and compress to WebP under 150KB
      const { dataUrl, sizeKB } = await getCroppedImg(imageSrc, croppedAreaPixels, 512);
      setOutputSizeKB(sizeKB);

      // 2. Transmit to backend
      setIsUploading(true);
      const res = await fetch("/api/user/update-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({
          email: userEmail,
          photoURL: dataUrl,
          avatar: dataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Server failed to save avatar");
      }

      // 3. Update global client state
      onPhotoUpdated(dataUrl);
      setSuccessToast("Profile picture updated successfully!");

      setTimeout(() => {
        setSuccessToast(null);
        handleClose();
      }, 1200);
    } catch (err: any) {
      console.error("[ProfileAvatarModal] Save error:", err);
      setErrorMsg(err.message || "Failed to save profile picture. Please try again.");
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);
      setErrorMsg(null);

      const res = await fetch("/api/user/update-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({
          email: userEmail,
          photoURL: "",
          avatar: "",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove photo");
      }

      onPhotoUpdated("");
      setImageSrc(null);
      setSuccessToast("Profile photo removed.");

      setTimeout(() => {
        setSuccessToast(null);
        handleClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setErrorMsg(null);
    setSuccessToast(null);
    setOutputSizeKB(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing && !isUploading) {
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Update Profile Picture
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                1:1 circular crop &amp; WebP optimization (&lt;150KB)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing || isUploading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Notification Feedback Banner */}
          {successToast && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          {!imageSrc ? (
            /* Current Avatar Preview & Selection View */
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full ring-4 ring-orange-500/20 dark:ring-orange-500/30 overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {currentPhotoURL || currentAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-black text-orange-600 dark:text-orange-400">
                      {(userName || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold cursor-pointer backdrop-blur-[2px]"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span>Choose Photo</span>
                </button>
              </div>

              <div className="text-center space-y-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {userName}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {userEmail}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload New Photo</span>
                </button>

                {(currentPhotoURL || currentAvatar) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isUploading}
                    className="w-full py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold text-xs flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Interactive Cropping View */
            <div className="space-y-4">
              <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden ring-1 ring-slate-800">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>

              {/* Zoom & Slider Control */}
              <div className="space-y-1.5 px-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center space-x-1">
                    <ZoomIn className="w-3.5 h-3.5 text-orange-500" />
                    <span>Zoom &amp; Position</span>
                  </span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none"
                />
              </div>

              {outputSizeKB && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Compressed WebP size: ~{outputSizeKB} KB</span>
                </div>
              )}

              {/* Actions: Save & Cancel */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setImageSrc(null);
                    setZoom(1);
                  }}
                  disabled={isProcessing || isUploading}
                  className="py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isProcessing || isUploading}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveCropped}
                  disabled={isProcessing || isUploading}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isProcessing || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save &amp; Apply</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
