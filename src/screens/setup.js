import { h, screen } from "../ui/dom.js";
import { brand } from "../ui/brand.js";

export function setupScreen() {
  const el = screen("form-screen",
    h("div", { class: "screen__body stack" },
      brand(),
      h("h1", { class: "home__title" }, "Connect a Firebase project"),
      h("p", { class: "text-muted" }, "This copy of the app has no database connected yet."),
      h("ol", { class: "steps" },
        h("li", {}, "Create a Firebase project and add a Web app."),
        h("li", {}, "Create a Firestore database and publish the rules from firestore.rules."),
        h("li", {}, "Paste the web config into src/config/firebase-config.js and reload.")
      ),
      h("p", { class: "text-muted" }, "The README has the full walkthrough.")
    )
  );
  return { el };
}
