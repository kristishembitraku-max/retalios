;(function () {
  'use strict'

  var config = window.FluenceConfig || {}
  var token = config.token
  if (!token) return console.error('[FluenceAI] Missing token in window.FluenceConfig')

  var BASE_URL = config.baseUrl || (document.currentScript && document.currentScript.src
    ? new URL(document.currentScript.src).origin
    : window.location.origin)

  var sessionId = sessionStorage.getItem('fluence_session') || Math.random().toString(36).slice(2) + Date.now()
  sessionStorage.setItem('fluence_session', sessionId)

  var botData = null
  var isOpen = false
  var messages = []
  var inputEl = null
  var messagesEl = null

  var styles = `
    #fluence-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #fluence-fab {
      position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
      border: none; cursor: pointer; z-index: 999998;
      box-shadow: 0 4px 24px rgba(99,102,241,0.5);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #fluence-fab:hover { transform: scale(1.08); box-shadow: 0 6px 32px rgba(99,102,241,0.6); }
    #fluence-fab svg { width: 24px; height: 24px; fill: white; }
    #fluence-window {
      position: fixed; bottom: 92px; right: 24px; width: 380px; height: 560px; max-height: 80vh;
      background: white; border-radius: 20px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
      display: flex; flex-direction: column; z-index: 999997;
      overflow: hidden; transform: scale(0.9) translateY(20px);
      opacity: 0; pointer-events: none;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
    }
    #fluence-window.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }
    #fluence-header {
      background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
      padding: 16px 20px; display: flex; align-items: center; gap: 12px;
    }
    #fluence-avatar {
      width: 40px; height: 40px; background: rgba(255,255,255,0.25); border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    #fluence-avatar svg { width: 22px; height: 22px; fill: white; }
    #fluence-bot-name { color: white; font-weight: 600; font-size: 15px; }
    #fluence-bot-status { color: rgba(255,255,255,0.75); font-size: 12px; display: flex; align-items: center; gap: 4px; }
    #fluence-status-dot { width: 7px; height: 7px; background: #4ade80; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    #fluence-close {
      margin-left: auto; background: rgba(255,255,255,0.15); border: none; cursor: pointer;
      width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    }
    #fluence-close svg { width: 16px; height: 16px; fill: white; }
    #fluence-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;
      scroll-behavior: smooth;
    }
    #fluence-messages::-webkit-scrollbar { width: 4px; }
    #fluence-messages::-webkit-scrollbar-track { background: transparent; }
    #fluence-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
    .fluence-msg { max-width: 80%; display: flex; flex-direction: column; }
    .fluence-msg.bot { align-self: flex-start; }
    .fluence-msg.user { align-self: flex-end; }
    .fluence-bubble {
      padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5;
    }
    .fluence-msg.bot .fluence-bubble { background: #f3f4f6; color: #111827; border-bottom-left-radius: 4px; }
    .fluence-msg.user .fluence-bubble { background: linear-gradient(135deg, #6366f1, #7c3aed); color: white; border-bottom-right-radius: 4px; }
    .fluence-time { font-size: 11px; color: #9ca3af; margin-top: 4px; }
    .fluence-msg.user .fluence-time { text-align: right; }
    .fluence-typing { display: flex; align-items: center; gap: 4px; padding: 10px 14px; background: #f3f4f6; border-radius: 16px; border-bottom-left-radius: 4px; width: fit-content; }
    .fluence-typing span { width: 7px; height: 7px; background: #9ca3af; border-radius: 50%; animation: bounce 1.2s infinite; }
    .fluence-typing span:nth-child(2) { animation-delay: 0.2s; }
    .fluence-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
    #fluence-input-row {
      padding: 12px 16px; border-top: 1px solid #f3f4f6; display: flex; gap: 8px; align-items: flex-end;
    }
    #fluence-input {
      flex: 1; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 9px 12px;
      font-size: 14px; resize: none; outline: none; line-height: 1.4; max-height: 120px;
      transition: border-color 0.15s;
    }
    #fluence-input:focus { border-color: #6366f1; }
    #fluence-send {
      width: 38px; height: 38px; background: linear-gradient(135deg, #6366f1, #7c3aed);
      border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: opacity 0.15s;
    }
    #fluence-send:disabled { opacity: 0.4; cursor: not-allowed; }
    #fluence-send svg { width: 18px; height: 18px; fill: white; }
    #fluence-footer { padding: 6px; text-align: center; font-size: 10px; color: #d1d5db; }
    #fluence-footer a { color: #d1d5db; text-decoration: none; }
    @media (max-width: 440px) { #fluence-window { width: calc(100vw - 16px); right: 8px; bottom: 80px; } }
  `

  function addStyle() {
    var s = document.createElement('style')
    s.textContent = styles
    document.head.appendChild(s)
  }

  function timeStr() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function renderMessage(role, text) {
    var div = document.createElement('div')
    div.className = 'fluence-msg ' + role
    var bubble = document.createElement('div')
    bubble.className = 'fluence-bubble'
    bubble.textContent = text
    var time = document.createElement('div')
    time.className = 'fluence-time'
    time.textContent = timeStr()
    div.appendChild(bubble)
    div.appendChild(time)
    return div
  }

  function showTyping() {
    var el = document.createElement('div')
    el.id = 'fluence-typing'
    el.className = 'fluence-msg bot'
    el.innerHTML = '<div class="fluence-typing"><span></span><span></span><span></span></div>'
    messagesEl.appendChild(el)
    messagesEl.scrollTop = messagesEl.scrollHeight
    return el
  }

  function removeTyping() {
    var el = document.getElementById('fluence-typing')
    if (el) el.remove()
  }

  function addMessage(role, text) {
    messages.push({ role: role, text: text })
    var el = renderMessage(role, text)
    messagesEl.appendChild(el)
    setTimeout(function() { messagesEl.scrollTop = messagesEl.scrollHeight }, 50)
    return el
  }

  function sendMessage(text) {
    if (!text.trim()) return
    addMessage('user', text)
    inputEl.value = ''
    inputEl.style.height = 'auto'
    document.getElementById('fluence-send').disabled = true
    var typing = showTyping()

    var payload = { token: token, sessionId: sessionId, message: text }
    fetch(BASE_URL + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(r) { return r.json() })
    .then(function(data) {
      removeTyping()
      addMessage('bot', data.response || 'Sorry, I encountered an issue. Please try again.')
      document.getElementById('fluence-send').disabled = false
    })
    .catch(function() {
      removeTyping()
      addMessage('bot', 'I apologize — I\'m having trouble connecting right now. Please try again in a moment.')
      document.getElementById('fluence-send').disabled = false
    })
  }

  function toggleChat() {
    isOpen = !isOpen
    var win = document.getElementById('fluence-window')
    var fab = document.getElementById('fluence-fab')
    win.classList.toggle('open', isOpen)
    fab.innerHTML = isOpen
      ? '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>'
    if (isOpen && inputEl) setTimeout(function() { inputEl.focus() }, 300)
  }

  function buildWidget(data) {
    addStyle()
    var botName = data.name || 'AI Assistant'
    var welcome = data.welcomeMessage || ('Hi! I\'m ' + botName + '. How can I help you today?')

    var fab = document.createElement('button')
    fab.id = 'fluence-fab'
    fab.setAttribute('aria-label', 'Open chat')
    fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>'
    fab.addEventListener('click', toggleChat)

    var win = document.createElement('div')
    win.id = 'fluence-window'
    win.setAttribute('role', 'dialog')
    win.setAttribute('aria-label', botName + ' chat')
    win.innerHTML = `
      <div id="fluence-header">
        <div id="fluence-avatar">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
        </div>
        <div>
          <div id="fluence-bot-name">${botName}</div>
          <div id="fluence-bot-status"><div id="fluence-status-dot"></div>Online</div>
        </div>
        <button id="fluence-close" onclick="document.getElementById('fluence-fab').click()" aria-label="Close chat">
          <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
        </button>
      </div>
      <div id="fluence-messages"></div>
      <div id="fluence-input-row">
        <textarea id="fluence-input" placeholder="Type a message..." rows="1" aria-label="Message input"></textarea>
        <button id="fluence-send" aria-label="Send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div id="fluence-footer">Powered by <a href="https://fluenceai.com" target="_blank">Fluence AI</a></div>
    `

    document.body.appendChild(fab)
    document.body.appendChild(win)

    messagesEl = document.getElementById('fluence-messages')
    inputEl = document.getElementById('fluence-input')

    addMessage('bot', welcome)

    document.getElementById('fluence-send').addEventListener('click', function() {
      sendMessage(inputEl.value)
    })

    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputEl.value) }
    })

    inputEl.addEventListener('input', function() {
      this.style.height = 'auto'
      this.style.height = Math.min(this.scrollHeight, 120) + 'px'
    })

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) toggleChat()
    })
  }

  function init() {
    fetch(BASE_URL + '/api/embed/' + token)
      .then(function(r) { return r.json() })
      .then(function(data) {
        if (data.error) return console.error('[FluenceAI]', data.error)
        botData = data
        buildWidget(data)
      })
      .catch(function(err) {
        console.warn('[FluenceAI] Could not load bot config, using defaults', err)
        buildWidget({})
      })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
