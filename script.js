// ১. URL থেকে মূল ওয়েবসাইটের পাঠানো ডেটা রিসিভ করা
const urlParams = new URLSearchParams(window.location.search);
const room_id = urlParams.get('room') || '0';
const room_title = urlParams.get('title') || 'Ha Ha Live আড্ডা';
const current_user_name = urlParams.get('user_name') || 'অপরিচিত মেম্বার';
const current_user_pic = urlParams.get('user_pic') || 'default_avatar.png';

// পেজ লোড হতেই রুমের নাম সেট করা
document.getElementById('room-title').innerText = decodeURIComponent(room_title);

// ২. ডিফল্টভাবে হোস্টকে ১ নম্বর সিটে বসিয়ে দেওয়া
if(room_id !== '0') {
    document.getElementById('img-seat-1').src = decodeURIComponent(current_user_pic);
    document.getElementById('name-seat-1').innerText = decodeURIComponent(current_user_name);
}

// ৩. সিটে বসার লজিক (সাধারণ ইউজারদের জন্য)
function joinSeat(seatNumber) {
    // জাস্ট ডেমো হিসেবে সিটে ডাটা সেট করা (আসল কানেকশনে এটি Agora/ZegoCloud দিয়ে সিঙ্ক হবে)
    document.getElementById(`img-seat-${seatNumber}`).src = decodeURIComponent(current_user_pic);
    document.getElementById(`name-seat-${seatNumber}`).innerText = decodeURIComponent(current_user_name);
    
    // সিটে বসার পর মিউট আইকন অন করা
    document.getElementById(`seat-${seatNumber}`).querySelector('.mic-status').classList.remove('mute');
    document.getElementById(`seat-${seatNumber}`).querySelector('.mic-status').innerText = "🎙️";
}

// ৪. মাইক্রোফোন অন/অফ এবং অ디오 সিগন্যাল (Pulse Effect) টেস্ট করা
let isMuted = false;
function toggleMic() {
    isMuted = !isMuted;
    const btn = document.getElementById('mic-toggle');
    const hostPulse = document.querySelector('#seat-1 .pulse-wave');
    const hostMicIcon = document.querySelector('#seat-1 .mic-status');
    
    if(isMuted) {
        btn.innerText = "🔇 মাইক্রোফোন অফ";
        btn.style.background = "#555";
        hostPulse.style.display = "none"; // কথা বলা বন্ধ (সিগন্যাল অফ)
        hostMicIcon.innerText = "🔇";
        hostMicIcon.classList.add('mute');
    } else {
        btn.innerText = "🎙️ মাইক্রোফোন অন";
        btn.style.background = "linear-gradient(45deg, #ff9800, #ff5722)";
        hostPulse.style.display = "block"; // কথা বলা শুরু (সিগন্যাল অ্যানিমেশন অন)
        hostMicIcon.innerText = "🎙️";
        hostMicIcon.classList.remove('mute');
    }
}

// ৫. ইমোজি বা ছোট রিয়্যাকশন টেস্ট
function sendEmoji(emoji) {
    alert("আপনি রিয়্যাকশন দিয়েছেন: " + emoji);
}

// ৬. রুম থেকে বের হয়ে যাওয়া (মূল ড্যাশবোর্ডে ব্যাক করা)
function exitRoom() {
    // এটি ইউজারকে আবার আপনার মূল ড্যাশবোর্ডে ফেরত পাঠিয়ে দেবে
    window.location.href = "http://hahalive.free.nf/dashboard.php";
}
