import { useEffect, useRef, useState } from "react";
import { Mode } from "@border-code/shared";
import { usePromptConfig } from "../../providers/config/prompt-config";
import { useTheme } from "../../providers/theme";
import { EmptyBorder } from "../border";
import { StatusBar } from "../status";
import type { KeyBinding, TextareaRenderable } from "@opentui/core";
import { useDialog } from "../../providers/dialog";
import { ThemeDialogContent } from "../dialogs/theme/theme-dialog";
import { CommandMenuContent } from "../dialogs/menu/command";
import type { MENU_ITEMS } from "../dialogs/menu/items";
import { useKeyboardLayer } from "../../providers/config/keyboard";
import { useKeyboard } from "@opentui/react";

type Props = {
	onSubmit: (text: string) => void | Promise<void>;
	disabled?: boolean;
};

export const TEXTAREA_KEY_BINDINGS: KeyBinding[] = [
	{ name: "return", action: "submit" },
	{ name: "enter", action: "submit" },
	{ name: "return", shift: true, action: "newline" },
	{ name: "enter", shift: true, action: "newline" },
];

export default function PromptInput({ onSubmit, disabled }: Props) {
	const { colors } = useTheme();
	const { mode, setMode } = usePromptConfig();
	const textareaRef = useRef<TextareaRenderable>(null);
	const { open, isOpen } = useDialog();
	const wasDialogOpen = useRef(false);

	useEffect(() => {
		if (wasDialogOpen.current && !isOpen) {
			textareaRef.current?.focus();
		}
		wasDialogOpen.current = isOpen;
	}, [isOpen]);

  const handleOnSubmit = async () => {
    if (disabled) return;
		const text = textareaRef.current?.plainText ?? "";
		if (!text) return;
		try {
			await onSubmit(text);
			textareaRef.current?.clear();
		} catch {}
	};

	useKeyboard((key) => {
		if (key.name === "tab" && !key.shift) {
			setMode(mode === "BUILD" ? "PLAN" : "BUILD");
		}
		if (key.name === "tab" && key.shift) {
			open({
				title: "Command Menu",
				children: <CommandMenuContent />,
			});
		}
	});

	const handleContentChange = () => {
		if (!textareaRef.current) return;
		const { plainText } = textareaRef.current;
		if (plainText.startsWith("/")) {
			const hasWhitespaceAfterSlash = /^\/\s/.test(plainText);
			if (!hasWhitespaceAfterSlash) {
				open({
					title: "Command Menu",
					children: <CommandMenuContent />,
				});
			}
		}
	};

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	return (
		<box width="100%" alignItems="center">
			<box
				border={["left"]}
				borderColor={mode === Mode.BUILD ? colors.primary : colors.planMode}
				customBorderChars={{
					...EmptyBorder,
					vertical: "┃",
					bottomLeft: "╹",
				}}
				width="100%"
			>
				<box
					position="relative"
					justifyContent="center"
					paddingX={2}
					paddingY={1}
					backgroundColor={colors.surface}
					width="100%"
					gap={1}
				>
          <textarea
						placeholder="Ask or command anything..."
						keyBindings={TEXTAREA_KEY_BINDINGS}
						ref={textareaRef}
						onSubmit={handleOnSubmit}
						onContentChange={handleContentChange}
						height={2}
						width={"auto"}
					/>
					<StatusBar />
				</box>
			</box>
		</box>
	);
}

type CommandMenuProps = {
	filteredItems: typeof MENU_ITEMS | null;
};

const CommandMenu = ({ filteredItems }: CommandMenuProps) => {
	const { colors } = useTheme();
	const height = Math.max(4, filteredItems?.length ?? 0);

	return (
		<scrollbox
			height={height}
			backgroundColor={colors.surface}
			padding={1}
			position="absolute"
			bottom={5.5}
			left={-1}
			zIndex={99}
		>
			<box flexDirection="column">
				{filteredItems &&
					filteredItems.map((i) => (
						<box flexDirection="row" gap={1} key={i.value}>
							<text>/{i.label}</text>
							<text fg={colors.dimSeparator}>{i.description}</text>
						</box>
					))}
				{(!filteredItems || filteredItems.length === 0) && (
					<text fg={colors.dimSeparator}>No matching commands available</text>
				)}
			</box>
		</scrollbox>
	);
};
