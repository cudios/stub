import { emit } from "../core/bus.js";

export function commit(write, failureMessage) {
  write.catch((error) => {
    console.error(failureMessage, error);
    emit("toast", { message: `${failureMessage} (${error.code || "error"})`, tone: "bad" });
  });
}
