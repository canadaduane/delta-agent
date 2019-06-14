import { getChanges, applyChanges } from "./diff";
import Automerge from "automerge";

const js0 = {};
const js1 = { hi: 2 };
const js2 = { hi: 2, bye: 3 };

let doc1 = Automerge.init();

doc1 = Automerge.change(doc1, "change", doc => {
  const delta = getChanges(js0, js1);
  applyChanges(doc, delta);
});

doc1 = Automerge.change(doc1, "change", doc => {
  const delta = getChanges(js1, js2);
  applyChanges(doc, delta);
});

const history = Automerge.getHistory(doc1).map(state => [
  state.change.message,
  state.snapshot
]);

console.log("History", history);
