import { h, replace, screen } from "../ui/dom.js";
import { icon } from "../ui/icons.js";
import { emptyState } from "../ui/empty.js";
import { roleLabel } from "../ui/labels.js";
import { brand } from "../ui/brand.js";
import { listMemberships } from "../core/store.js";
import { navigate } from "../core/router.js";
import { on } from "../core/bus.js";
import { canInstall, promptInstall } from "../core/pwa.js";
import { formatRange } from "../domain/dates.js";

function eventCard(membership) {
  return h("button", { class: "event-card", type: "button", onclick: () => navigate(`/e/${membership.eventId}`) },
    h("span", { class: "event-card__main" },
      h("span", { class: "event-card__name" }, membership.name || "New event"),
      h("span", { class: "event-card__meta" }, membership.startDate ? formatRange(membership.startDate, membership.endDate) : "Details appear after the first sync")
    ),
    h("span", { class: ["badge", membership.role === "manager" && "badge--solid"] }, roleLabel(membership.role)),
    icon("chevron", { size: 18 })
  );
}

export function homeScreen() {
  const install = h("button", { class: "btn btn--ghost btn--small", type: "button", hidden: !canInstall(), onclick: promptInstall }, icon("install", { size: 18 }), "Install app");
  const offInstall = on("install:available", (available) => { install.hidden = !available; });
  const list = h("div", { class: "stack stack--tight" });
  const memberships = listMemberships();

  replace(list, memberships.length
    ? memberships.map(eventCard)
    : emptyState("No events yet", "Events you create or join on this device show up here."));

  const el = screen("home",
    h("header", { class: "home__head" }, brand(), install),
    h("section", { class: "home__intro" },
      h("h1", { class: "home__title" }, "Entry passes that keep working when the network doesn't."),
      h("p", { class: "text-muted" }, "Create an event, hand out QR passes and scan them at the gate, with or without signal. Devices sync and cross-check each other once they're back online.")
    ),
    h("div", { class: "home__actions" },
      h("button", { class: "btn btn--primary btn--block btn--large", type: "button", onclick: () => navigate("/create") }, icon("plus"), "Create event"),
      h("button", { class: "btn btn--ghost btn--block btn--large", type: "button", onclick: () => navigate("/join") }, "Enter a code")
    ),
    h("section", { class: "section" }, h("h2", { class: "section__title" }, "Your events"), list)
  );

  return { el, destroy: offInstall };
}
