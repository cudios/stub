import { h, screen } from "../ui/dom.js";
import { appBar } from "../ui/app-bar.js";
import { emptyState } from "../ui/empty.js";
import { navigate } from "../core/router.js";

export function notOnDeviceScreen() {
  const el = screen("form-screen",
    appBar({ title: "Event", onBack: () => navigate("/", { replace: true }) }).el,
    h("div", { class: "screen__body" },
      emptyState("This event isn't on this device", "Join it with a manager or volunteer code first.",
        h("button", { class: "btn btn--primary", type: "button", onclick: () => navigate("/join", { replace: true }) }, "Enter a code")
      )
    )
  );
  return { el };
}
