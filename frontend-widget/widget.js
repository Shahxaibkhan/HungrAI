<script>
(function(){
  const restaurant = "demo-burger-bistro"; // restaurant slug
  const apiBase = "http://localhost:4000"; // backend API
  const brandColor = "#000"; // or dynamic from restaurant data

  if (!localStorage.getItem("hungraiSession")) {
    localStorage.setItem("hungraiSession", crypto.randomUUID());
  }
  const sessionId = localStorage.getItem("hungraiSession");

  // 🟢 Floating button
  const bubble = document.createElement("div");
  bubble.innerHTML = `<img src="https://i.ibb.co/3Yf6D8Y/hungrai-logo.png" style="width:22px;margin-right:6px;vertical-align:middle;"> <span style="vertical-align:middle;">Chat with Hungrai</span>`;
  Object.assign(bubble.style,{
    position:"fixed",bottom:"20px",right:"20px",
    background:"linear-gradient(135deg,#000,#434343)",
    color:"#fff",padding:"12px 18px",borderRadius:"30px",
    cursor:"pointer",fontFamily:"Inter,Arial",fontWeight:"500",
    display:"flex",alignItems:"center",zIndex:"99999",boxShadow:"0 4px 16px rgba(0,0,0,0.2)"
  });
  document.body.appendChild(bubble);

  // 🪄 Chat box
  const chatBox=document.createElement("div");
  Object.assign(chatBox.style,{
    position:"fixed",bottom:"80px",right:"20px",width:"360px",height:"500px",
    background:"#f9f9f9",borderRadius:"16px",border:"1px solid #ccc",
    display:"none",flexDirection:"column",overflow:"hidden",
    boxShadow:"0 12px 32px rgba(0,0,0,0.3)",fontFamily:"Inter,Arial"
  });
  document.body.appendChild(chatBox);

  // Header
  const header=document.createElement("div");
  header.innerHTML=`<img src="https://i.ibb.co/3Yf6D8Y/hungrai-logo.png" style="width:26px;margin-right:8px;vertical-align:middle;"> <span style="font-weight:600;">Hungrai</span>`;
  Object.assign(header.style,{
    background:brandColor,color:"#fff",padding:"14px",fontSize:"16px",
    display:"flex",alignItems:"center",gap:"8px"
  });
  chatBox.appendChild(header);

  // Messages
  const msgs=document.createElement("div");
  Object.assign(msgs.style,{flex:"1",padding:"10px",overflowY:"auto",background:"#fff"});
  chatBox.appendChild(msgs);

  // Input area
  const inputWrap=document.createElement("div");
  inputWrap.style.display="flex";inputWrap.style.borderTop="1px solid #ddd";
  const input=document.createElement("input");
  Object.assign(input.style,{flex:"1",padding:"10px",border:"none",outline:"none",fontSize:"14px"});
  const sendBtn=document.createElement("button");
  sendBtn.innerHTML="➤";
  Object.assign(sendBtn.style,{background:brandColor,color:"#fff",border:"none",padding:"10px 14px",cursor:"pointer",borderRadius:"0 8px 0 0"});
  inputWrap.appendChild(input);inputWrap.appendChild(sendBtn);chatBox.appendChild(inputWrap);

  bubble.onclick=()=>chatBox.style.display=chatBox.style.display==="none"?"flex":"none";

  function appendBubble(sender,text){
    const b=document.createElement("div");
    const isUser=sender==="You";
    Object.assign(b.style,{
      maxWidth:"80%",margin:"8px 0",padding:"10px 14px",
      borderRadius:"14px",
      background:isUser?brandColor:"#eaeaea",
      color:isUser?"#fff":"#222",
      alignSelf:isUser?"flex-end":"flex-start",
      lineHeight:"1.4"
    });
    b.innerHTML=text;
    msgs.appendChild(b);
    msgs.scrollTop=msgs.scrollHeight;
  }

  const typingEl=document.createElement("div");
  typingEl.innerHTML="Hungrai is typing...";
  Object.assign(typingEl.style,{color:"#999",fontSize:"12px",margin:"6px"});
  function showTyping(show){ 
    if(show){ msgs.appendChild(typingEl); msgs.scrollTop=msgs.scrollHeight; } 
    else if(typingEl.parentNode){ typingEl.remove(); } 
  }

  async function sendMessage(){
    const msg=input.value.trim(); if(!msg)return;
    appendBubble("You",msg); input.value="";
    showTyping(true);
    try{
      const res=await fetch(`${apiBase}/api/chat/${restaurant}/message`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ message: msg, sessionId })
      });
      const data=await res.json();
      showTyping(false);
      // Replace $ with PKR
      const replyText=(data.reply||"").replace(/\$/g,"Rs.");
      appendBubble("Hungrai",replyText);
      if(data.orderId) appendBubble("Hungrai",`✅ Order placed successfully — ID: ${data.orderId}`);
    }catch(e){
      showTyping(false);
      appendBubble("Hungrai","⚠️ Sorry, something went wrong.");
    }
  }

  sendBtn.onclick=sendMessage;
  input.addEventListener("keydown",e=>{if(e.key==="Enter")sendMessage();});

  appendBubble("Hungrai","👋 Hi! I’m Hungrai — your smart AI waiter. What can I get for you today?");
})();
</script>
