const messagesMap = new Map<string, boolean>();

const getMessageMap = (key: string) => {
  return messagesMap.get(key);
};

const setMessageMap = (key: string) => {
  messagesMap.set(key, true);
};

const removeMessageMap = (key: string) => {
  messagesMap.delete(key);
};

export { setMessageMap, getMessageMap, removeMessageMap };
