import React from "react";
import Editor from "@monaco-editor/react";

function CodeEditor({ code, onChange }) {
  return (
    <Editor
      height="70vh"
      defaultLanguage="javascript"
      value={code}
      onChange={onChange}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false }
      }}
    />
  );
}

export default CodeEditor;
