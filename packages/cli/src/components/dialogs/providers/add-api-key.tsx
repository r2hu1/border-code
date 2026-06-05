import type { InputRenderable } from "@opentui/core";
import { useRef } from "react";
import { useToast } from "../../../providers/toast";
import { TEXTAREA_KEY_BINDINGS } from "../../input/prompt-input";
import { createConfig, updateConfig } from "@border-code/core-api";
import { useDialog } from "../../../providers/dialog";

export const AddApiKeyDialog = () => {
  const apiTextarea = useRef<InputRenderable>(null);
  const { show } = useToast();
  const { close } = useDialog();

  const handleSubmit = async () => {
    if (!apiTextarea.current) return;
    const { plainText } = apiTextarea.current;
    if (!plainText) {
      show({
        message: "API key cannot be empty",
        variant: "error",
      })
      return;
    };
    const req = await updateConfig({
      apiKey: plainText,
    });
    if (req) {
      show({
        message: "use / to select a llm model",
        variant: "success",
      });
      close();
    }
  };


  return (
    <box>
      <textarea keyBindings={TEXTAREA_KEY_BINDINGS} ref={apiTextarea} onKeyDown={handleSubmit} placeholder="Enter your API key..." focused/>
    </box>
  );
}
