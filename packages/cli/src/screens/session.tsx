import { useParams } from "react-router";

export default function Session() {
	const { id } = useParams();
	return (
		<box>
			<text>Session: {id}</text>
		</box>
	);
}
