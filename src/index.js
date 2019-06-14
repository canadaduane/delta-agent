import { prompt } from "enquirer";
import Debug from "debug";
import fs from "fs";

import logSwarmEvents from "./log-swarm-events";
import Hypermerge from "./p2p/hypermerge";
import { parseDocumentLink } from "./p2p/share-link";
import { getChanges, applyChanges } from "./diff";
import Path from "path";

const log = Debug("delta:agent");

const workspaceUrl =
  // "pushpin://board/BuxxncK49tXe1fwTvDt8Hh4iwGgMDMZEPf9LLP9Yy1zG/41Z";
  // "pushpin://board/Ap8LsBc1GvfAQ4W3NBkEECtkCme57YkeDVVUpcyYbG6V/9q2";
  // "pushpin://enumeration/Csds1f3iMKVRHeCSKz2ECQaKkuVb8JyvNhGfDBEikRpM/5ne";
  "pushpin://enumeration/7mkpzS2XSwhW2CWDiZ2grDQuq7QX3psArEyFseqJbRXo/9cF";
const { docId } = parseDocumentLink(workspaceUrl);

log("workspace URL", workspaceUrl);
log("docId", docId);

const USER_PATH =
  process.env["DATADIR"] || Path.join(process.env["HOME"], ".delta-agent");
const WORKSPACE_URL_PATH = Path.join(USER_PATH, "workspace-id.json");
const HYPERMERGE_PATH = Path.join(USER_PATH, "hypermerge");
const HYPERFILE_PATH = Path.join(USER_PATH, "hyperfile");

log("using hypermerge path", HYPERMERGE_PATH);
const hypermerge = new Hypermerge({ storage: HYPERMERGE_PATH, port: 0 });

let docState = {};
let handle;

process.on("SIGINT", function() {
  console.log("SIGINT", process.pid);
  process.exit();
});

hypermerge.once("ready", async () => {
  log("Joining Swarm");
  hypermerge.joinSwarm();

  const openDocument = docId => {
    handle = hypermerge.openHandle(docId);
    handle.onChange(doc => {
      log("doc change", docId, doc);
      docState = doc;
    });
  };

  const lockDocument = lockState => {
    handle.change(doc => {
      doc.locked = lockState;
    });
  };

  const saveState = () => {
    console.log(docState);
    fs.writeFile("card.json", JSON.stringify(docState.record, null, 4), err => {
      if (err) {
        console.error("Unable to save state to file");
      } else {
        lockDocument(true);
        console.log("Saved to file", "card.json");
      }
    });
  };

  const loadState = () => {
    const newRecord = JSON.parse(fs.readFileSync("card.json"));
    console.log("Loading new record:", newRecord);

    const delta = getChanges(docState.record, newRecord);

    console.log("Delta:", delta);

    handle.change(doc => {
      // console.log(doc);
      doc.locked = false;
      applyChanges(doc.record, delta);
    });
  };

  openDocument(docId);

  // Main Interaction Loop
  let response;
  while (true) {
    try {
      response = await prompt({
        type: "select",
        name: "action",
        message: "Next Action?",
        choices: [
          { message: "Check OUT json file (& LOCK record)", value: "out" },
          { message: "Check IN json file (& UNLOCK record)", value: "in" },
          { message: "Exit", value: "exit" }
        ]
      });
      console.log("\n");
    } catch (e) {
      process.exit(1);
    }

    switch (response.action) {
      case "out":
        saveState();
        break;

      case "in":
        loadState();
        break;

      default:
        process.exit(0);
    }
  }
});
