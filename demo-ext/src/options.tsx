import React from "react";
import { createRoot } from "react-dom/client";

const Options = () => {
	return <div>Options</div>;
};

const root = createRoot(document.getElementById("root") as Element);

root.render(
	<React.StrictMode>
		<Options />
	</React.StrictMode>,
);
