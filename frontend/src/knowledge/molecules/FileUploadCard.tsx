"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/common/atoms/ui/button";
import { Card, CardContent } from "@/common/atoms/ui/card";
import { cn } from "@/common/lib/utils";

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
    <Card
      className={cn(
        "border-2 border-dashed transition-all duration-200",
        dragOver
          ? "border-accent-blue bg-accent-blue/5 shadow-glow"
          : "border-border"
      )}
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
    >
      <CardContent className="flex flex-col items-center py-12 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue">
          <Upload className="h-6 w-6" aria-hidden />
        </span>
        <p className="font-display text-base font-semibold text-foreground">
          Upload documents
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, DOCX, or Markdown — drag & drop or browse
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.md,.markdown,.txt"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          className="mt-6"
          isLoading={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
      </CardContent>
    </Card>
  );
}
