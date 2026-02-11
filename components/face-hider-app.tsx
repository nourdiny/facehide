"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  API_URL,
  DEFAULT_MODE,
  MODE_OPTIONS
} from "@/lib/constants";
import { parseOutputImage, validateImageFile } from "@/lib/image-utils";
import { generateMockResult } from "@/lib/mock-processor";
import { HideMode, UploadSlot } from "@/types/face-hider";
import { ToggleSwitch } from "@/components/toggle-switch";
import { UploadCard } from "@/components/upload-card";
import styles from "./face-hider-app.module.css";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function revokeObjectUrl(url: string | null): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function FaceHiderApp() {
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [faceDragging, setFaceDragging] = useState(false);
  const [targetDragging, setTargetDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mockMode, setMockMode] = useState(true);
  const [mode, setMode] = useState<HideMode>(DEFAULT_MODE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);

  useEffect(() => {
    return () => revokeObjectUrl(facePreview);
  }, [facePreview]);

  useEffect(() => {
    return () => revokeObjectUrl(targetPreview);
  }, [targetPreview]);

  const canSubmit = useMemo(() => {
    return Boolean(faceFile && targetFile) && !isProcessing;
  }, [faceFile, isProcessing, targetFile]);

  const hasAnyState = useMemo(() => {
    return Boolean(faceFile || targetFile || resultImage || faceError || targetError);
  }, [faceFile, targetFile, resultImage, faceError, targetError]);

  const clearSlot = (slot: UploadSlot) => {
    setGlobalError(null);

    if (slot === "face") {
      setFaceFile(null);
      setFacePreview(null);
      setFaceError(null);
      return;
    }

    setTargetFile(null);
    setTargetPreview(null);
    setTargetError(null);
  };

  const setSlotFile = (slot: UploadSlot, file: File | null) => {
    if (!file) return;

    const validationError = validateImageFile(file);
    setGlobalError(null);

    if (validationError) {
      if (slot === "face") {
        setFaceError(validationError);
      } else {
        setTargetError(validationError);
      }
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (slot === "face") {
      setFaceError(null);
      setFaceFile(file);
      setFacePreview(previewUrl);
      return;
    }

    setTargetError(null);
    setTargetFile(file);
    setTargetPreview(previewUrl);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!faceFile || !targetFile || isProcessing) return;

    setGlobalError(null);
    setIsProcessing(true);
    const startedAt = performance.now();

    try {
      let outputImage: string;

      if (mockMode) {
        await wait(1200);
        outputImage = await generateMockResult(targetFile, mode);
      } else {
        const formData = new FormData();
        formData.append("face_image", faceFile);
        formData.append("target_image", targetFile);
        formData.append("mode", mode);

        const response = await fetch(API_URL, {
          method: "POST",
          body: formData
        });

        console.log(response);
        
        if (!response.ok) {
          const message = await response.text().catch(() => "");
          throw new Error(
            `API request failed (${response.status}). ${
              message.slice(0, 160) || "No error details were returned."
            }`
          );
        }

        outputImage = await parseOutputImage(response);
      }

      const elapsed = Math.round(performance.now() - startedAt);
      setResultImage(outputImage);
      setProcessingTimeMs(elapsed);
    } catch (error) {
      setResultImage(null);
      setProcessingTimeMs(null);
      setGlobalError(
        error instanceof Error
          ? error.message
          : "Processing failed due to an unexpected error."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;

    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `face-hider-result-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleStartOver = () => {
    setFaceFile(null);
    setTargetFile(null);
    setFacePreview(null);
    setTargetPreview(null);
    setFaceError(null);
    setTargetError(null);
    setGlobalError(null);
    setResultImage(null);
    setProcessingTimeMs(null);
    setMode(DEFAULT_MODE);
  };

  return (
    <main className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <a href="#home" className={styles.brand}>
            Face Hider
          </a>
          <nav className={styles.navLinks}>
            <a href="#tool">Tool</a>
            <a href="#result">Result</a>
            <a href="#how-it-works">How it Works</a>
          </nav>
        </div>
      </header>

      <section id="home" className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.badge}>Production-ready demo app</span>
          <h1 className={styles.heroTitle}>Face Hider - Hide Faces in Seconds</h1>
          <p className={styles.heroDescription}>
            Upload a face reference plus a target image, process them instantly, and
            download the hidden-face result. Mock Mode is enabled by default so you
            can test the complete workflow without a live backend.
          </p>
          <div className={styles.heroActions}>
            <a href="#tool" className={styles.primaryCta}>
              Try Now
            </a>
            <a href="#how-it-works" className={styles.secondaryCta}>
              How it Works
            </a>
          </div>
        </div>
        <div className={styles.heroPanel}>
          <div className={styles.heroStat}>
            <strong>2 Uploads</strong>
            <span>Face reference + target image</span>
          </div>
          <div className={styles.heroStat}>
            <strong>Mock Mode</strong>
            <span>Default ON for local simulation</span>
          </div>
          <div className={styles.heroStat}>
            <strong>Ready API</strong>
            <span>Multipart request wired for production</span>
          </div>
        </div>
      </section>

      <section id="tool" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Face Hider Tool</h2>
          <p>
            Upload both images, choose a mode, and process instantly with mock or real
            API mode.
          </p>
        </div>

        <form className={styles.toolCard} onSubmit={handleSubmit}>
          <ToggleSwitch
            id="mock-mode"
            checked={mockMode}
            disabled={isProcessing}
            label="Mock Mode"
            description={
              mockMode
                ? "ON: local canvas simulation, no API call."
                : "OFF: sends multipart/form-data to API endpoint."
            }
            onChange={setMockMode}
          />

          <div className={styles.modeGroup}>
            <p className={styles.modeLabel}>Hide mode</p>
            <div className={styles.modeOptions}>
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={[
                    styles.modeButton,
                    mode === option.value ? styles.modeButtonActive : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={isProcessing}
                  onClick={() => setMode(option.value)}
                  aria-pressed={mode === option.value}
                >
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.uploadGrid}>
            <UploadCard
              id="face-image"
              title="Face to Hide"
              hint="Reference face image"
              file={faceFile}
              previewUrl={facePreview}
              error={faceError}
              disabled={isProcessing}
              isDragging={faceDragging}
              onDragStateChange={setFaceDragging}
              onFileSelected={(file) => setSlotFile("face", file)}
              onRemove={() => clearSlot("face")}
            />
            <UploadCard
              id="target-image"
              title="Target Image"
              hint="Image where the face should be hidden"
              file={targetFile}
              previewUrl={targetPreview}
              error={targetError}
              disabled={isProcessing}
              isDragging={targetDragging}
              onDragStateChange={setTargetDragging}
              onFileSelected={(file) => setSlotFile("target", file)}
              onRemove={() => clearSlot("target")}
            />
          </div>

          {globalError ? (
            <div className={styles.errorBanner} role="alert">
              {globalError}
            </div>
          ) : null}

          <div className={styles.submitRow}>
            <button className={styles.submitButton} type="submit" disabled={!canSubmit}>
              {isProcessing ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  Processing...
                </>
              ) : (
                "Hide Face"
              )}
            </button>
            <p className={styles.submitHint}>
              API endpoint: <code>{API_URL}</code>
            </p>
          </div>
        </form>
      </section>

      <section id="result" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Result</h2>
          <p>Review, download, or reset your current run.</p>
        </div>

        <div className={styles.resultCard}>
          <div className={styles.resultFrame}>
            {isProcessing ? (
              <div className={styles.resultPlaceholder}>
                <span className={styles.spinner} aria-hidden="true" />
                <p>Processing...</p>
              </div>
            ) : resultImage ? (
              <img
                src={resultImage}
                alt="Processed output"
                className={styles.resultImage}
              />
            ) : (
              <div className={styles.resultPlaceholder}>
                <p>Processed image will appear here.</p>
              </div>
            )}
          </div>

          <div className={styles.resultMeta}>
            <p>
              Mode: <strong>{mode}</strong>
            </p>
            <p>
              Processing time:{" "}
              <strong>{processingTimeMs ? `${processingTimeMs} ms` : "-"}</strong>
            </p>
          </div>

          <div className={styles.resultActions}>
            <button
              type="button"
              className={styles.primaryAction}
              disabled={!resultImage || isProcessing}
              onClick={handleDownload}
            >
              Download Result
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              disabled={isProcessing || !hasAnyState}
              onClick={handleStartOver}
            >
              Start Over
            </button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>How it Works</h2>
        </div>
        <div className={styles.stepsGrid}>
          <article className={styles.stepCard}>
            <span>1</span>
            <h3>Upload face reference</h3>
            <p>Select the face image you want the system to hide.</p>
          </article>
          <article className={styles.stepCard}>
            <span>2</span>
            <h3>Upload target image</h3>
            <p>Choose the image where the selected face should be hidden.</p>
          </article>
          <article className={styles.stepCard}>
            <span>3</span>
            <h3>Submit and download result</h3>
            <p>Process and export the final output directly from the result panel.</p>
          </article>
        </div>
        <p className={styles.disclaimer}>
          This is a demo. The API endpoint can be configured later.
        </p>
      </section>
    </main>
  );
}
