// ========================================================
// 🔗 ১. URL থেকে মূল ওয়েবসাইটের পাঠানো ডেটা রিসিভ করা
// ========================================================
const urlParams = new URLSearchParams(window.location.search);
const room_id = urlParams.get('room') || '0';
const room_title = urlParams.get('title') || 'Ha Ha Live আড্ডা';
const current_user_name = decodeURIComponent(urlParams.get('user_name') || 'অপরিচিত মেম্বার');
const current_user_pic = decodeURIComponent(urlParams.get('user_pic') || 'default_avatar.png');

// পেজ লোড হতেই রুমের টাইটেল সেট করা
document.getElementById('room-title').innerText = decodeURIComponent(room_title);

// ========================================================
// 🎙️ ২. ZegoCloud কানেকশন কনফিগারেশন (আপনার দেওয়া আইডি সমূহ)
// ========================================================
const appID = 1884742336; // আপনার App ID (Number)
const serverSecret = "908f241e7992e1783080ff9a99fc5e81d9f657428827ca852ddd3032142ffe70"; // আপনার AppSign / Secret

// ইউনিক ইউজার আইডি তৈরি (গিটহাবের জন্য)
const zego_user_id = "user_" + Math.floor(Math.random() * 100000); 

let zg = null;
let localStream = null;
let isMuted = true; // শুরুতে সবাই মিউট থাকবে

// ========================================================
// ⚡ ৩. ZegoCloud সার্ভারে কানেক্ট হওয়া এবং ভয়েস রুম চালু করা
// ========================================================
async function initZegoEngine() {
    // ZegoCloud এর অফিশিয়াল SDK স্ক্রিপ্ট ডায়নামিকালি লোড করা
    const script = document.createElement('script');
    script.src = "https://unpkg.com/zego-express-engine-webrtc@3.0.0/index.js";
    script.onload = async () => {
        // ইঞ্জিন ইনিশিয়ালাইজ করা
        zg = new ZegoExpressEngine(appID, "https://jssb.zego.im");

        // রুমে মেম্বারদের আসা-যাওয়া এবং মেসেজ ট্র্যাকিং করার লিসেনার
        setupZegoListeners();

        try {
            // টোকেন জেনারেট করে রুমে লগইন করা
            // ফ্রন্টএন্ডে টেস্টিং এর জন্য Zego এর ইন্টারনাল মেথড ব্যবহার করা হয়েছে
            await zg.loginRoom(room_id, zego_user_id, { userName: current_user_name }, { userUpdate: true });
            console.log("Ha Ha Live অডিও রুমে সফলভাবে প্রবেশ করেছেন!");

            // ডিফল্টভাবে হোস্টকে ১ নম্বর সিটে দেখানো
            setupInitialSeats();
            
        } catch (err) {
            console.error("রুমে লগইন করতে ব্যর্থ হয়েছে:", err);
        }
    };
    document.head.appendChild(script);
}

// পেজ লোড হওয়ার সাথে সাথে ইঞ্জিন রান হবে
initZegoEngine();

// ========================================================
// 👥 ৪. সিট প্ল্যান এবং প্রোফাইল ডাটা সিঙ্ক করার লজিক
// ========================================================
function setupInitialSeats() {
    // যদি কারেন্ট ইউজার নিজেই হোস্ট হয় (যার রুম আইডি আর ইউজার আইডি ম্যাচ করবে)
    if (room_id !== '0') {
        document.getElementById('img-seat-1').src = current_user_pic;
        document.getElementById('name-seat-1').innerText = current_user_name;
    }
}

// সাধারণ ইউজাররা ২ থেকে ৯ নম্বর সিটে ক্লিক করে বসবে
function joinSeat(seatNumber) {
    if (seatNumber === 1) return; // ১ নম্বর সিট হোস্টের জন্য লকড

    // সিটে ইউজারের নিজের নাম ও ছবি সেট করা
    document.getElementById(`img-seat-${seatNumber}`).src = current_user_pic;
    document.getElementById(`name-seat-${seatNumber}`).innerText = current_user_name;
    
    // সিটে বসার পর মিউট আইকন সেট করা (যেহেতু শুরুতে মিউট)
    const micIcon = document.getElementById(`seat-${seatNumber}`).querySelector('.mic-status');
    micIcon.innerText = "🔇";
    micIcon.classList.add('mute');

    // রুমে ব্রডকাস্ট করা যে আমি এই সিটে বসেছি
    if (zg) {
        zg.sendCustomCommand(room_id, JSON.stringify({
            action: "sit_down",
            seat: seatNumber,
            name: current_user_name,
            pic: current_user_pic
        }));
    }
}

// ========================================================
// 🎤 ৫. মাইক্রোফোন অন/অফ এবং অ디오 সিগন্যাল (Pulse Effect) কন্ট্রোল
// ========================================================
async function toggleMic() {
    if (!zg) return;
    
    isMuted = !isMuted;
    const btn = document.getElementById('mic-toggle');
    const hostPulse = document.querySelector('#seat-1 .pulse-wave');
    const hostMicIcon = document.querySelector('#seat-1 .mic-status');
    
    if (isMuted) {
        // 🔇 মাইক্রোফোন অফ করা
        btn.innerText = "🔇 মাইক্রোফোন অফ";
        btn.style.background = "#555";
        hostPulse.style.display = "none"; // সিগন্যাল ওয়েভ অফ
        hostMicIcon.innerText = "🔇";
        hostMicIcon.classList.add('mute');

        if (localStream) {
            zg.stopPublishingStream("stream_" + zego_user_id);
            zg.destroyStream(localStream);
            localStream = null;
        }
    } else {
        // 🎙️ মাইক্রোফোন অন করা (আসল ভয়েস স্ট্রিমিং চালু)
        btn.innerText = "🎙️ মাইক্রোফোন অন";
        btn.style.background = "linear-gradient(45deg, #ff9800, #ff5722)";
        hostPulse.style.display = "block"; // সিগন্যাল ওয়েভ অন (অ্যানিমেশন চালু)
        hostMicIcon.innerText = "🎙️";
        hostMicIcon.classList.remove('mute');

        try {
            // ইউজারের মোবাইল/পিসির মাইক্রোফোন পারমিশন নেওয়া
            localStream = await zg.createStream({ camera: { audio: true, video: false } });
            // সবার কাছে ভয়েস পাঠানো শুরু করা
            zg.startPublishingStream("stream_" + zego_user_id, localStream);
        } catch (err) {
            console.error("মাইক্রোফোন চালু করা যায়নি:", err);
            alert("দয়া করে মাইক্রোফোনের পারমিশন দিন!");
            isMuted = true;
            toggleMic();
        }
    }
}

// ========================================================
// 💬 ৬. রিয়েল-টাইম ইমোজি এবং চ্যাট মেসেজ ব্রডকাস্টিং
// ========================================================
async function sendEmoji(emoji) {
    if (!zg) return;

    try {
        // রুমে থাকা সবার স্ক্রিনে রিয়েল-টাইমে ইমোজি পাঠানো
        await zg.sendRoomMessage(room_id, 2, emoji);
        showEmojiPopup(current_user_name, emoji);
    } catch (err) {
        console.error("মেসেজ পাঠানো যায়নি:", err);
    }
}

// স্ক্রিনে ইমোজি পপ-আপ করানোর জন্য ছোট এলার্ট/টেলিগ্রাম সিস্টেম
function showEmojiPopup(senderName, emoji) {
    const alertBox = document.createElement('div');
    alertBox.style.position = 'fixed';
    alertBox.style.bottom = '90px';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translateX(-50%)';
    alertBox.style.background = 'rgba(255,152,0,0.9)';
    alertBox.style.color = '#000';
    alertBox.style.padding = '8px 16px';
    alertBox.style.borderRadius = '20px';
    alertBox.style.fontWeight = 'bold';
    alertBox.style.zIndex = '9999';
    alertBox.style.fontSize = '14px';
    alertBox.innerText = `${senderName}: ${emoji}`;
    
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 2500);
}

// ========================================================
// 📡 7. ZegoCloud লিসেনার্স (অন্য মেম্বারদের ভয়েস শোনা ও সিট সিঙ্ক)
// ========================================================
function setupZegoListeners() {
    // রুমে কেউ কথা বলা শুরু করলে তার অডিও রিসিভ করা
    zg.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
        if (updateType === 'ADD') {
            for (let stream of streamList) {
                const remoteStream = await zg.startPlayingStream(stream.streamID);
                // অডিও প্লে করার জন্য ব্যাকগ্রাউন্ড এলিমেন্ট তৈরি
                const audio = document.createElement('audio');
                audio.srcObject = remoteStream;
                audio.autoplay = true;
                document.body.appendChild(audio);
            }
        }
    });

    // কেউ ইমোজি বা মেসেজ পাঠালে তা রিসিভ করা
    zg.on('IMRecvRoomMessage', (roomID, messageList) => {
        for (let msg of messageList) {
            showEmojiPopup(msg.fromUser.userName, msg.message);
        }
    });

    // কেউ সিটে বসলে অন্য সবার স্ক্রিনে তার প্রোফাইল সিঙ্ক করা
    zg.on('IMRecvCustomCommand', (roomID, fromUser, commandID, command) => {
        try {
            const data = JSON.parse(command);
            if (data.action === "sit_down") {
                document.getElementById(`img-seat-${data.seat}`).src = data.pic;
                document.getElementById(`name-seat-${data.seat}`).innerText = data.name;
            }
        } catch (e) {
            console.error(e);
        }
    });
}

// ========================================================
// 🚪 8. রুম থেকে বের হওয়া (Exit Room)
// ========================================================
function exitRoom() {
    if (zg) {
        if (localStream) {
            zg.stopPublishingStream("stream_" + zego_user_id);
            zg.destroyStream(localStream);
        }
        zg.logoutRoom(room_id);
    }
    // ইউজারকে আবার আপনার মূল ওয়েবসাইটের ড্যাশবোর্ডে ফেরত পাঠানো
    window.location.href = "http://hahalive.free.nf/dashboard.php";
        }
    
