#!/usr/bin/env node
import("../dist/main.js")
  .then((m) => m.main())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
