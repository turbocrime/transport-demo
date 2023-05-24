import React from "react";
import { createRoot } from "react-dom/client";

const Popup = () => {
	return <div>Popup</div>;
};

const root = createRoot(document.getElementById("root") as Element);

root.render(
	<React.StrictMode>
		<Popup />
	</React.StrictMode>,
);
