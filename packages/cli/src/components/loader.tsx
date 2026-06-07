import "opentui-spinner/react";
import { Mode, type ModeType } from "@border-code/shared";
import { useTheme } from "../providers/theme";

type Props = {
	mode?: ModeType;
	name?: any;
};

export function Loader({ mode = Mode.BUILD, name = "aesthetic" }: Props) {
	const { colors } = useTheme();
	const activeColor = mode === Mode.PLAN ? colors.planMode : colors.primary;

	return <spinner name={name} color={activeColor} />;
}
