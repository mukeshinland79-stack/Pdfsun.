import React from "react";
import { PDFEditorWorkspace } from "./PDFEditorWorkspace";

export interface AnnotatePdfWorkspaceProps {
  file: File;
  onClose: () => void;
  onSaveComplete?: (outputBytes: Uint8Array, fileName: string) => void;
}

export const AnnotatePdfWorkspace: React.FC<AnnotatePdfWorkspaceProps> = (props) => {
  return <PDFEditorWorkspace {...props} />;
};
