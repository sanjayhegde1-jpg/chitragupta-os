const major = Number(process.versions.node.split(".")[0]);

if (major !== 20) {
  console.warn(
    `[preflight] WARNING: Node ${process.version} detected. ` +
      "This repo is tested against Node 20.x. " +
      "Proceeding, but CI/Functions may fail on other versions."
  );
}
