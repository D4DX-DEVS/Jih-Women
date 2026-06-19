const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    registrationEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);

/**
 * Returns the singleton settings document, creating it with defaults if it doesn't exist.
 */
async function getSettings() {
  let doc = await Settings.findOne().lean();
  if (!doc) {
    doc = await Settings.create({});
  }
  return doc;
}

module.exports = Settings;
module.exports.getSettings = getSettings;
