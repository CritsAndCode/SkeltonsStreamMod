// (F O U N D R Y - S T R E A M - M O D   0 . 2 . 7)

//(() => {})();

import "./scripts/tmi.min.js"; // I M P O R T S
import * as fsmcore from "./scripts/fsmcore.js";
import { fsMod } from "./scripts/streamTwitch.js";
import fsmLayer from "./scripts/modLayer.js";
import * as settings from "./scripts/settings.js";
import { DiceRoller } from "https://cdn.jsdelivr.net/npm/rpg-dice-roller@4.5.2/lib/esm/bundle.min.js";

const roller = new DiceRoller(); // C O N S T A N T S   A N D   V A R I A B L E S
const CHAT_MESSAGE_TYPES = {
  OTHER: 0,
  OOC: 1,
  IC: 2,
  EMOTE: 3,
  WHISPER: 4,
  ROLL: 5,
};

let currentTab = "foundry";

Hooks.on("renderChatLog", async function (chatLog, html, user) {
  // S O R T   T A B B E D   M S G S

  if (fsmcore.TabbedChat()) return;
  if (game.settings.get("streamMod", "hideTwitchChat")) return;

  var toPrepend = '<nav class="fsmtabs tabs">';
  toPrepend += `<a class="item foundry" data-tab="foundry">Foundry</a><i id="foundryNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>`;
  toPrepend += `<a class="item fsm" data-tab="fsm">Twitch</a></nav><i id="fsmNotification" class="notification-pip fas fa-exclamation-circle" style="display: none;"></i>`;
  html.prepend(toPrepend);

  var me = this;
  const tabs = new TabsV2({
    navSelector: ".tabs",
    contentSelector: ".content",
    initial: "tab1",
    callback: function (event, html, tab) {
        currentTab = tab;
        let chatLog = $("#chat-log");

        let itemType0 = chatLog.find(".type0");
        let itemType1 = chatLog.find(".type1");
        let itemType2 = chatLog.find(".type2");
        let itemType3 = chatLog.find(".type3");
        let itemType4 = chatLog.find(".type4");
        let itemType5 = chatLog.find(".type5");
      if (tab == "foundry") {
          itemType0.removeClass("hardHide");
          itemType0.show();
          itemType1.hide();
          itemType2.removeClass("hardHide");
          itemType2.show();
          itemType3.removeClass("hardHide");
          itemType3.show();
          itemType4.removeClass("hardHide");
          itemType4.show();
          itemType5.removeClass("hardHide");
          itemType5.not(".gm-roll-hidden").show();

        $("#foundryNotification").hide();
      } else if (tab == "fsm") {
          itemType1.removeClass("hardHide");
          itemType1.show();
          itemType2.hide();
          itemType3.hide();
          itemType4.hide();
          itemType5.hide();
          itemType0.hide();

        $("#fsmNotification").hide();
      } else {
        console.log("Unknown tab " + tab + "!");
      }

      chatLog.scrollTop(9999999);
    },
  });
  tabs.bind(html[0]);
});

Hooks.on("renderChatMessage", (chatMessage, html, data) => {
  // R E N D E R   T A B B E D   C H A T

  //if (fsmcore.TabbedChat()) return;

  html.addClass("type" + data.message.type);

  var sceneMatches = true;

  if (
    data.message.type == 0 ||
    data.message.type == 2 ||
    data.message.type == 3 ||
    data.message.type == 4 ||
    data.message.type == 5
  ) {
    if (data.message.speaker.scene != undefined) {
      html.addClass("scenespecific");
      html.addClass("scene" + data.message.speaker.scene);
      if (data.message.speaker.scene != game.user.viewedScene) {
        sceneMatches = false;
      }
    }
  }

  if (currentTab == "foundry") {
    /*if (
      (fsmcore.xCmd()) &&
      data.message.type == 1) {
      data.message.type == 2}*/
    if (
      (data.message.type == 2 ||
        data.message.type == 0 ||
        data.message.type == 4 ||
        data.message.type == 3) &&
      sceneMatches
    ) {
      html.css("display", "list-item");
    } else if (data.message.type == 5 && sceneMatches) {
      if (!html.hasClass("gm-roll-hidden")) {
        if (
          game.dice3d &&
          game.settings.get("dice-so-nice", "settings").enabled &&
          game.settings.get("dice-so-nice", "enabled")
        ) {
          if (
            !game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages")
          )
            return;
        }
        html.css("display", "list-item");
      }
    } else {
      html.css("display", "none");
      html.css("cssText", "display: none !important;");
      html.addClass("hardHide");
    }
  } else if (currentTab == "fsm") {
    if (data.message.type == 1) {
      html.css("display", "list-item");
    } else {
      html.css("display", "none");
    }
  }
});

Hooks.on("diceSoNiceRollComplete", (id) => {
  // P L A Y   N I C E   W I T H   D S N

  if (fsmcore.TabbedChat()) return;

  if (currentTab != "foundry") {
    $("#chat-log .message[data-message-id=" + id + "]").css("display", "none");
  }
});

Hooks.on("createChatMessage", (chatMessage, content) => {
  // C H A T   N O T I F I C A T I O N S

  if (fsmcore.TabbedChat()) return;

  var sceneMatches = true;

  if (chatMessage.data.speaker.scene) {
    if (chatMessage.data.speaker.scene != game.user.viewedScene) {
      sceneMatches = false;
    }
  }

  if (
    chatMessage.data.type == 0 ||
    chatMessage.data.type == 2 ||
    chatMessage.data.type == 3 ||
    chatMessage.data.type == 4
  ) {
    if (currentTab != "foundry" && sceneMatches) {
      $("#foundryNotification").show();
    }
  } else if (chatMessage.data.type == 5) {
    if (
      currentTab != "foundry" &&
      sceneMatches &&
      chatMessage.data.whisper.length == 0
    ) {
      $("#foundryNotification").show();
    }
  } else if (chatMessage.data.type == 1) {
    if (currentTab != "fsm" && sceneMatches) {
      $("#fsmNotification").show();
    }
  } else {
    if (currentTab != "fsm") {
      $("#fsmNotification").show();
    }
  }
});

Hooks.on("preCreateChatMessage", (chatMessage, content) => {
  // T U R N   I C   M S G S   I N T O   O O C   I F   x C m d   O F F
  if (fsmcore.xCmd()) {
    if (currentTab == "foundry") {
      if (chatMessage.type == 2) {
        chatMessage.type = 2;
      }
    }
  } 
  if (!fsmcore.xCmd()) {
    if (game.settings.get("streamMod", "icChatInOoc"))   {
      if (currentTab == "fsm") {
        if (chatMessage.type == 2) {
        chatMessage.type = 1;
        delete chatMessage.speaker;
        console.log(chatMessage);
        } 
      }
    }
  }
});

Hooks.on("renderSceneNavigation", (sceneNav, html, data) => {
  // R E N D E R   N A V   F O R   T A B S
  if (fsmcore.TabbedChat()) return;

  var viewedScene = sceneNav.scenes.find((x) => x.isView);

  $(".scenespecific").hide();
  if (currentTab == "fsm") {
    $(".type1.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type1.scene" + viewedScene.id).show();
  } else if (currentTab == "foundry") {
    $(".type0.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type0.scene" + viewedScene.id).show();
    $(".type2.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type2.scene" + viewedScene.id).show();
    $(".type3.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type3.scene" + viewedScene.id).show();
    $(".type4.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type4.scene" + viewedScene.id).show();
    $(".type5.scene" + game.user.viewedScene).removeClass("hardHide");
    $(".type5.scene" + viewedScene.id)
      .not(".gm-roll-hidden")
      .show();
  }
});

Hooks.on("init", function () {
  // M O D - S E T T I N G S
  settings.registerSettings();
});

Hooks.once("canvasReady", () => {
  // C A N V A S   L A Y E R
  // Add fsmLayer to canvas
  const layerct = canvas.stage.children.length;
  let tbLayer = new fsmLayer();

  tbLayer.setButtons();
  tbLayer.roleTest();
  canvas.fsMod = canvas.stage.addChildAt(tbLayer, layerct);
  canvas.fsMod.draw();

  let theLayers = Canvas.layers;
  theLayers.fsMod = fsmLayer;

  Object.defineProperty(Canvas, "layers", {
    get: function () {
      return theLayers;
    },
  });
});

Hooks.on("ready", function () {
  // O N - R E A D Y - C O N N E C T I O N S

  fsmcore.SetupTwitchClient();
  onStream();
  fsmcore.streamDice();
  fsmcore.AnnounceTime1();
  fsmcore.AnnounceTime2();
});

Hooks.on("createChatMessage", async (message) => {
  // F O U N D R Y => T W I T C H
  if (fsmcore.xCmd()) return;
  if (message.data.type === 4) return;
  let testQuiet = game.settings.get("streamMod", "streamQuiet");
  if (testQuiet === true) {
    if (message.data.type === 0) return;
    if (message.data.type === 5) return;  
  if (message.export().includes("Stream Chat")) return;
  if (message.export().includes("#00000004.0000AC0")) return;
  if (game.settings.get("streamMod", "streamModEcho")) {
      let firstGm = game.users.find((u) => u.isGM && u.active);    
      if (firstGm && game.user === firstGm) {
      let myChannel = game.settings.get("streamMod", "streamChannel");
      let tempAlias = message.alias;
      let tempM = message.export();
      let res = tempM.slice(23);
      let res1 = res.replace(/(^|\s)] \s?/g, " "); // Removes '] ' that may appear when stripping the timestamp
      let res2 = res1.replace(/(^|\s)Damage Apply Apply Half\s?/g, " "); // <= PF1e specific roll cleanup
      let res3 = res2.replace(/(^|\s)Info Attack Action\s?/g, " "); // <= PF1e specific roll cleanup
      let fin = res3.replace(tempAlias, "[" + tempAlias + "]: ");
      fsMod.client.say(myChannel, fin);
    }
  }
}});

Hooks.on('preCreateChatMessage', (data, opts, usr) => {
  if (!fsmcore.xCmd()) return
  if (game.user.isGM && data.type === CONST.CHAT_MESSAGE_TYPES.OOC) data.type = CONST.CHAT_MESSAGE_TYPES.IC;
})

Hooks.on("chatCommandsReady", function(chatCommands) {
  if (!fsmcore.xCmd()) {
  console.log("Registering Chat Commands: OFF")
  let ctype = game.settings.get("streamMod", "streamChatType");
  chatCommands.registerCommand(chatCommands.createCommandFromData({
    commandKey: "/t",
    invokeOnCommand: (chatlog, messageText, chatdata) => {      
      ChatMessage.create({
        speaker: {
            alias: "Foundry Stream Module"
        },
        content: `Guru Meditation: Error #00000004.0000AC0 - Message not sent to Twitch because you used the /t command without having it enabled in your FSM config.`
    });
      console.log(messageText);
    },
    shouldDisplayToChat: false,
    createdMessageType: ctype,
    iconClass: "fa-sticky-note",
    description: "Please enable in FSM config"
  }));
    return
  } 
  if (fsmcore.xCmd()) {     
  console.log("Registering Chat Commands: ON")
  let ctype = game.settings.get("streamMod", "streamChatType");
  chatCommands.registerCommand(chatCommands.createCommandFromData({
    commandKey: "/t",
    invokeOnCommand: (chatlog, messageText, chatdata) => {     
      let who = chatdata.speaker.alias; 
      streamOut(messageText, who);
      console.log(messageText, chatdata.speaker.alias);
    },
    shouldDisplayToChat: true,
    createdMessageType: ctype,
    iconClass: "fa-sticky-note",
    description: "Sends message to Twitch"
  })); 
  console.log("commandKey loaded")
}
  
});