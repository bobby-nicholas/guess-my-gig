const createMessage = content => ({ role: 'user', content });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const parseArguments = args => {
    try { return JSON.parse(args); }
    catch  { return {}; }
};

export default { createMessage, sleep, parseArguments };