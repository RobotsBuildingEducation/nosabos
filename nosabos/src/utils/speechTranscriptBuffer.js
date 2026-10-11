// Input items can finish transcription out of order. Keep one evolving
// transcript per item; final events replace partial text instead of appending it.
export function createSpeechTranscriptBuffer() {
  const items = new Map();
  const order = [];
  const events = new Set();
  const ensure = (id) => {
    if (!items.has(id)) {
      items.set(id, { text: "", final: false });
      order.push(id);
    }
    return items.get(id);
  };
  return {
    commit(id, previousId) {
      if (!id) return;
      ensure(id);
      if (previousId === id || previousId === undefined) return;
      if (previousId) ensure(previousId);
      order.splice(order.indexOf(id), 1);
      order.splice(previousId ? order.indexOf(previousId) + 1 : 0, 0, id);
    },
    delta(id, text, eventId) {
      if (eventId && events.has(eventId)) return;
      if (eventId) events.add(eventId);
      const item = ensure(id || "legacy");
      if (!item.final) item.text += text || "";
    },
    complete(id, text) {
      const item = ensure(id || "legacy");
      item.text = text || "";
      item.final = true;
    },
    isComplete(id) {
      return items.get(id || "legacy")?.final === true;
    },
    text() {
      return order.map(id => items.get(id).text.trim()).filter(Boolean).join(" ");
    },
  };
}
