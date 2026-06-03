"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/atoms/Button";

export function FileUploadCard({
  onUpload,
  isUploading,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files?.[0]) return;
    onUpload(files[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        dragOver ? "border-zinc-900 bg-zinc-50" : "border-zinc-300"
      }`}
    >
      <p className="text-sm text-zinc-600">Drag & drop PDF, DOCX, or Markdown</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.md,.markdown,.txt"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        className="mt-4"
        isLoading={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        Choose file
      </Button>
    </div>
  );
}
