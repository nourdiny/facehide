"use client";

import { DragEvent, useRef } from "react";
import { INPUT_ACCEPT } from "@/lib/constants";
import { formatBytes } from "@/lib/image-utils";
import styles from "./upload-card.module.css";

interface UploadCardProps {
  id: string;
  title: string;
  hint: string;
  file: File | null;
  previewUrl: string | null;
  error: string | null;
  disabled?: boolean;
  isDragging: boolean;
  onDragStateChange: (isDragging: boolean) => void;
  onFileSelected: (file: File | null) => void;
  onRemove: () => void;
}

export function UploadCard({
  id,
  title,
  hint,
  file,
  previewUrl,
  error,
  disabled = false,
  isDragging,
  onDragStateChange,
  onFileSelected,
  onRemove
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    onFileSelected(selectedFile);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!disabled) onDragStateChange(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onDragStateChange(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onDragStateChange(false);
    if (disabled) return;
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    onFileSelected(droppedFile);
  };

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.hint}>{hint}</p>
      </header>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={INPUT_ACCEPT}
        className={styles.input}
        disabled={disabled}
        onChange={handleInputChange}
      />

      <button
        type="button"
        className={[
          styles.dropZone,
          isDragging ? styles.dropZoneDragging : "",
          previewUrl ? styles.dropZoneFilled : "",
          error ? styles.dropZoneError : ""
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        onClick={openPicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <img className={styles.previewImage} src={previewUrl} alt={`${title} preview`} />
        ) : (
          <div className={styles.emptyState}>
            <svg
              className={styles.uploadIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 16V4M12 4L8 8M12 4L16 8M4 14V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className={styles.emptyTitle}>Drop image here or click to upload</p>
            <p className={styles.emptySubtitle}>JPG, PNG, WEBP up to 10MB</p>
          </div>
        )}
      </button>

      <footer className={styles.footer}>
        {file ? (
          <div className={styles.meta}>
            <span className={styles.fileName} title={file.name}>
              {file.name}
            </span>
            <span className={styles.fileSize}>{formatBytes(file.size)}</span>
          </div>
        ) : (
          <p className={styles.placeholder}>No image selected</p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionButton}
            disabled={disabled}
            onClick={openPicker}
          >
            {file ? "Replace" : "Upload"}
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.removeButton}`}
            disabled={disabled || !file}
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </footer>

      {error ? (
        <p className={styles.errorAlert} role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}
