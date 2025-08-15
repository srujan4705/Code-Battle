import React from "react";
import Editor from "@monaco-editor/react";

function CodeEditor({ code, onChange, readOnly = false }) {
  return (
    <Editor
      height="70vh"
      defaultLanguage="javascript"
      value={code}
      onChange={readOnly ? undefined : onChange}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        readOnly: readOnly
      }}
    />
  );
}

export default CodeEditor;
