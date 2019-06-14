import Hyperdiscovery from "hyperdiscovery";
import Fs from "fs";
import Debug from "debug";

import Multicore from "./multicore";

const log = Debug("delta:hyperfile");

export default class HyperfileStore {
  constructor(storePath) {
    this.multicore = new Multicore(storePath);
  }

  // callback = (err, hyperfileId)
  write(filePath, callback) {
    log("write", filePath);
    this.multicore.ready(() => {
      const feed = multicore.createFeed();

      Fs.readFile(filePath, (error, buffer) => {
        if (error) {
          callback(error);
          return;
        }

        feed.append(buffer, error => {
          if (error) {
            callback(error);
            return;
          }

          const hyperfileId = feed.key.toString("hex");
          log("wrote", filePath, hyperfileId);

          Hyperdiscovery(feed);
          callback(null, hyperfileId);
        });
      });
    });
  }

  writeBuffer(buffer, callback) {
    log("writeBuffer");
    this.multicore.ready(() => {
      const feed = multicore.createFeed();

      feed.append(buffer, error => {
        if (error) {
          callback(error);
          return;
        }

        const hyperfileId = feed.key.toString("hex");
        log("wroteBuffer", hyperfileId);

        Hyperdiscovery(feed);
        callback(null, hyperfileId);
      });
    });
  }

  // callback = (err, blob)
  fetch(hyperfileId, callback) {
    log("fetch", hyperfileId);
    this.multicore.ready(() => {
      const feedKey = Buffer.from(hyperfileId, "hex");
      const feed = multicore.createFeed(feedKey);

      feed.on("error", callback);
      feed.ready(() => {
        Hyperdiscovery(feed);
        feed.get(0, null, (error, data) => {
          if (error) {
            callback(error);
            return;
          }

          callback(null, data);
        });
      });
    });
  }
}
