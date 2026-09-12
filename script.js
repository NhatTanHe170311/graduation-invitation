/* ==========================================================================
   GRADUATION INVITATION APPLICATION LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. INITIAL STATE & CONFIGURATION ---
    const defaultConfig = {
        name: 'Nguyễn Nhật Tân - HE170311',
        major: 'Khóa Sinh Viên 2020 - 2026',
        school: 'TRƯỜNG ĐẠI HỌC FPT (FPT UNIVERSITY)',
        avatar: 'assets/graduate.png',
        dateStr: 'Thứ Tư, 16/09/2026',
        timeStr: '13:00 - 17:00',
        isoDate: '2026-09-16T13:00',
        venue: 'Hội trường MMH',
        address: 'Trung tâm Hội nghị Quốc gia, Cổng số 1, Đại lộ Thăng Long, Nam Từ Liêm, Hà Nội',
        message: 'Năm 2026 đánh dấu cột mốc 20 năm hình thành và phát triển của Trường Đại học FPT. Lễ Tốt nghiệp năm nay càng thêm ý nghĩa khi tuổi 20 của FPTU cũng là lúc một thế hệ sinh viên khép lại hành trình học tập tại giảng đường, sẵn sàng bước tới chặng đường mới. Để cùng ghi dấu khoảnh khắc đặc biệt ấy, Tân trân trọng kính mời bạn tới tham dự và chung vui cùng Tân!',
        theme: 'theme-fpt'
    };

    let appConfig = JSON.parse(localStorage.getItem('grad_invitation_config')) || defaultConfig;
    let rsvpList = JSON.parse(localStorage.getItem('grad_invitation_rsvps')) || getSampleRSVPs();
    let wishesList = JSON.parse(localStorage.getItem('grad_invitation_wishes')) || getSampleWishes();
    let isMusicPlaying = false;
    let audioCtx = null;
    let musicInterval = null;
    let countdownInterval = null;

    // --- 2. DOM ELEMENTS ---
    const envelopeWrapper = document.getElementById('envelope-wrapper');
    const envelopeSection = document.getElementById('envelope-section');
    const cardSection = document.getElementById('card-section');

    const displayAvatar = document.getElementById('display-avatar');
    const displayName = document.getElementById('display-name');
    const displayMajor = document.getElementById('display-major');
    const displaySchool = document.getElementById('display-school');
    const displayDate = document.getElementById('display-date');
    const displayTime = displayDate.nextElementSibling || document.getElementById('display-time');
    const displayVenue = document.getElementById('display-venue');
    const displayAddress = document.getElementById('display-address');
    const displayMessage = document.getElementById('display-message');
    const displaySignature = document.getElementById('display-signature');

    // Controls & Buttons
    const btnMusic = document.getElementById('btn-music');
    const btnCustomizer = document.getElementById('btn-customizer');
    const btnViewRsvp = document.getElementById('btn-view-rsvp');
    const btnExportCard = document.getElementById('btn-export-card');
    const btnShareLink = document.getElementById('btn-share-link');

    // Modals
    const customizerModal = document.getElementById('customizer-modal');
    const rsvpModal = document.getElementById('rsvp-modal');
    const shareModal = document.getElementById('share-modal');

    // Forms
    const rsvpForm = document.getElementById('rsvp-form');
    const wishAuthorInput = document.getElementById('wish-author');
    const wishTextInput = document.getElementById('wish-text');
    const btnPostWish = document.getElementById('btn-post-wish');
    const wishesGrid = document.getElementById('wishes-grid');

    // --- 3. INIT APPLICATION ---
    initTheme(appConfig.theme);
    applyConfigToDOM(appConfig);
    renderWishes();
    updateRSVPCounters();
    initCountdownTimer(appConfig.isoDate);

    // --- 4. ENVELOPE OPEN ANIMATION ---
    if (envelopeWrapper) {
        envelopeWrapper.addEventListener('click', openEnvelope);
    }

    function openEnvelope() {
        envelopeWrapper.classList.add('open');
        triggerConfetti();

        // Start background ambient music synth
        toggleMusic(true);

        setTimeout(() => {
            envelopeSection.style.display = 'none';
            cardSection.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 900);
    }

    // --- 5. CONFIGURATION & DOM BINDING ---
    function applyConfigToDOM(config) {
        displayName.textContent = config.name;
        displayMajor.innerHTML = `<i class="fa-solid fa-book-open"></i> ${config.major}`;
        displaySchool.innerHTML = `<i class="fa-solid fa-university"></i> ${config.school}`;
        if (config.avatar) displayAvatar.src = config.avatar;
        displayDate.textContent = config.dateStr;
        const timeEl = document.getElementById('display-time');
        if (timeEl) timeEl.textContent = config.timeStr;
        displayVenue.textContent = config.venue;
        displayAddress.textContent = config.address;
        displayMessage.textContent = config.message;
        displaySignature.textContent = config.name;

        // Map Info
        const mapVenueTitle = document.getElementById('map-venue-title');
        const mapAddressText = document.getElementById('map-address-text');
        const btnOpenMap = document.getElementById('btn-open-map');

        if (mapVenueTitle) mapVenueTitle.textContent = config.venue;
        if (mapAddressText) mapAddressText.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${config.address}`;
        if (btnOpenMap) btnOpenMap.href = `https://maps.google.com/?q=${encodeURIComponent(config.address)}`;

        // Update Google Calendar Link
        updateGoogleCalendarLink(config);
    }

    function initTheme(themeName) {
        document.body.className = `${themeName} ${isMusicPlaying ? 'music-playing' : ''}`;
    }

    function updateGoogleCalendarLink(config) {
        const calLink = document.getElementById('google-calendar-link');
        if (!calLink) return;

        const eventTitle = encodeURIComponent(`Lễ Tốt Nghiệp - ${config.name}`);
        const eventDetails = encodeURIComponent(`Trân trọng kính mời bạn đến dự Lễ Tốt Nghiệp của ${config.name}. ${config.message}`);
        const eventLoc = encodeURIComponent(`${config.venue}, ${config.address}`);

        calLink.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&details=${eventDetails}&location=${eventLoc}`;
    }

    // --- 6. COUNTDOWN TIMER ENGINE ---
    function initCountdownTimer(targetIsoDate) {
        if (countdownInterval) clearInterval(countdownInterval);

        function updateTimer() {
            const targetDate = new Date(targetIsoDate).getTime();
            const now = new Date().getTime();
            const diff = targetDate - now;

            const daysEl = document.getElementById('cd-days');
            const hoursEl = document.getElementById('cd-hours');
            const minsEl = document.getElementById('cd-minutes');
            const secsEl = document.getElementById('cd-seconds');

            if (!daysEl) return;

            if (diff <= 0) {
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minsEl.textContent = '00';
                secsEl.textContent = '00';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minsEl.textContent = String(minutes).padStart(2, '0');
            secsEl.textContent = String(seconds).padStart(2, '0');
        }

        updateTimer();
        countdownInterval = setInterval(updateTimer, 1000);
    }

    // --- 7. RSVP SYSTEM ---
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('rsvp-name').value.trim();
            const phone = document.getElementById('rsvp-phone').value.trim();
            const guests = document.getElementById('rsvp-guests').value;
            const attendance = document.querySelector('input[name="attendance"]:checked').value;
            const afterparty = document.getElementById('rsvp-afterparty').value;
            const note = document.getElementById('rsvp-note').value.trim();

            if (!name) return showToast('Vui lòng nhập tên của bạn!');

            const newRSVP = {
                id: Date.now(),
                name,
                phone,
                guests: parseInt(guests),
                attendance,
                afterparty,
                note,
                createdAt: new Date().toLocaleString('vi-VN')
            };

            rsvpList.unshift(newRSVP);
            localStorage.setItem('grad_invitation_rsvps', JSON.stringify(rsvpList));
            updateRSVPCounters();
            rsvpForm.reset();

            triggerConfetti();
            showToast('🎉 Cảm ơn bạn! Phản hồi RSVP của bạn đã được ghi nhận.');
        });
    }

    function updateRSVPCounters() {
        const rsvpCountEl = document.getElementById('rsvp-count');
        if (rsvpCountEl) rsvpCountEl.textContent = rsvpList.length;

        const attending = rsvpList.filter(r => r.attendance === 'attending');
        const declined = rsvpList.filter(r => r.attendance === 'declined');
        const totalPeople = attending.reduce((sum, r) => sum + r.guests, 0);

        const countAttendingEl = document.getElementById('count-attending');
        const countDeclinedEl = document.getElementById('count-declined');
        const countTotalPeopleEl = document.getElementById('count-total-people');

        if (countAttendingEl) countAttendingEl.textContent = attending.length;
        if (countDeclinedEl) countDeclinedEl.textContent = declined.length;
        if (countTotalPeopleEl) countTotalPeopleEl.textContent = totalPeople;

        renderRSVPTable();
    }

    function renderRSVPTable() {
        const tbody = document.getElementById('rsvp-table-body');
        if (!tbody) return;

        if (rsvpList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có phản hồi RSVP nào.</td></tr>`;
            return;
        }

        tbody.innerHTML = rsvpList.map((r, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${escapeHtml(r.name)}</strong></td>
                <td>${escapeHtml(r.phone || '-')}</td>
                <td>${r.attendance === 'attending' ? '<span style="color:#10B981;">✓ Tham dự</span>' : '<span style="color:#F43F5E;">✗ Rất tiếc vắng</span>'}</td>
                <td>${r.guests} người</td>
                <td>${r.afterparty === 'yes' ? 'Có' : 'Không'}</td>
                <td>${escapeHtml(r.note || '-')}</td>
            </tr>
        `).join('');
    }

    // Clear RSVP Data
    const btnClearRsvp = document.getElementById('btn-clear-rsvp');
    if (btnClearRsvp) {
        btnClearRsvp.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách RSVP?')) {
                rsvpList = [];
                localStorage.setItem('grad_invitation_rsvps', JSON.stringify([]));
                updateRSVPCounters();
                showToast('Đã xóa toàn bộ dữ liệu RSVP.');
            }
        });
    }

    // Copy RSVP Data
    const btnCopyRsvp = document.getElementById('btn-copy-rsvp');
    if (btnCopyRsvp) {
        btnCopyRsvp.addEventListener('click', () => {
            if (rsvpList.length === 0) return showToast('Chưa có dữ liệu để copy.');
            const text = rsvpList.map(r => `${r.name} | SĐT: ${r.phone || '-'} | Trạng thái: ${r.attendance} | Đi cùng: ${r.guests} người | Note: ${r.note || '-'}`).join('\n');
            navigator.clipboard.writeText(text);
            showToast('Đã copy danh sách RSVP vào clipboard!');
        });
    }

    // --- 8. WISHES WALL SYSTEM ---
    let selectedSticker = '🎓';
    const stickerBtns = document.querySelectorAll('.sticker-btn');
    stickerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            stickerBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSticker = btn.getAttribute('data-sticker');
        });
    });

    if (btnPostWish) {
        btnPostWish.addEventListener('click', () => {
            const author = wishAuthorInput.value.trim();
            const text = wishTextInput.value.trim();

            if (!author || !text) return showToast('Vui lòng nhập tên và nội dung lời chúc!');

            const newWish = {
                id: Date.now(),
                author,
                text,
                sticker: selectedSticker,
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN')
            };

            wishesList.unshift(newWish);
            localStorage.setItem('grad_invitation_wishes', JSON.stringify(wishesList));
            renderWishes();

            wishAuthorInput.value = '';
            wishTextInput.value = '';

            triggerConfetti();
            showToast('💐 Lời chúc mừng của bạn đã được đăng lên Bức Tường!');
        });
    }

    function renderWishes() {
        if (!wishesGrid) return;
        wishesGrid.innerHTML = wishesList.map(w => `
            <div class="wish-card">
                <div class="wish-header">
                    <span class="wish-author-name">${escapeHtml(w.author)}</span>
                    <span class="wish-sticker">${w.sticker || '🎓'}</span>
                </div>
                <p class="wish-body-text">${escapeHtml(w.text)}</p>
                <div class="wish-time">${w.time}</div>
            </div>
        `).join('');
    }

    // --- 9. CARD CUSTOMIZER MODAL ---
    if (btnCustomizer) {
        btnCustomizer.addEventListener('click', () => {
            populateCustomizerFields();
            customizerModal.classList.remove('hidden');
        });
    }

    const btnCloseCustomizer = document.getElementById('btn-close-customizer');
    if (btnCloseCustomizer) {
        btnCloseCustomizer.addEventListener('click', () => customizerModal.classList.add('hidden'));
    }

    function populateCustomizerFields() {
        document.getElementById('edit-name').value = appConfig.name;
        document.getElementById('edit-major').value = appConfig.major;
        document.getElementById('edit-school').value = appConfig.school;
        document.getElementById('edit-date').value = appConfig.dateStr;
        document.getElementById('edit-time').value = appConfig.timeStr;
        document.getElementById('edit-countdown-date').value = appConfig.isoDate;
        document.getElementById('edit-venue').value = appConfig.venue;
        document.getElementById('edit-address').value = appConfig.address;
        document.getElementById('edit-message').value = appConfig.message;

        // Theme buttons state
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(opt => {
            opt.classList.toggle('active', opt.getAttribute('data-theme') === appConfig.theme);
        });
    }

    // Theme Picker
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            themeOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            appConfig.theme = opt.getAttribute('data-theme');
            initTheme(appConfig.theme);
        });
    });

    // Avatar File Upload Reader
    const editAvatarFile = document.getElementById('edit-avatar-file');
    if (editAvatarFile) {
        editAvatarFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    appConfig.avatar = event.target.result;
                    displayAvatar.src = appConfig.avatar;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Save Customizer
    const btnSaveCustomizer = document.getElementById('btn-save-customizer');
    if (btnSaveCustomizer) {
        btnSaveCustomizer.addEventListener('click', () => {
            appConfig.name = document.getElementById('edit-name').value.trim() || defaultConfig.name;
            appConfig.major = document.getElementById('edit-major').value.trim() || defaultConfig.major;
            appConfig.school = document.getElementById('edit-school').value.trim() || defaultConfig.school;
            appConfig.dateStr = document.getElementById('edit-date').value.trim() || defaultConfig.dateStr;
            appConfig.timeStr = document.getElementById('edit-time').value.trim() || defaultConfig.timeStr;
            appConfig.isoDate = document.getElementById('edit-countdown-date').value || defaultConfig.isoDate;
            appConfig.venue = document.getElementById('edit-venue').value.trim() || defaultConfig.venue;
            appConfig.address = document.getElementById('edit-address').value.trim() || defaultConfig.address;
            appConfig.message = document.getElementById('edit-message').value.trim() || defaultConfig.message;

            localStorage.setItem('grad_invitation_config', JSON.stringify(appConfig));
            applyConfigToDOM(appConfig);
            initCountdownTimer(appConfig.isoDate);

            customizerModal.classList.add('hidden');
            showToast('✨ Đã cập nhật và lưu thông tin thiệp thành công!');
        });
    }

    // --- 10. RSVP MODAL ---
    if (btnViewRsvp) {
        btnViewRsvp.addEventListener('click', () => rsvpModal.classList.remove('hidden'));
    }
    const btnCloseRsvpModal = document.getElementById('btn-close-rsvp-modal');
    if (btnCloseRsvpModal) {
        btnCloseRsvpModal.addEventListener('click', () => rsvpModal.classList.add('hidden'));
    }

    // --- 11. HD CARD CANVAS EXPORT ---
    if (btnExportCard) {
        btnExportCard.addEventListener('click', () => {
            showToast('📷 Đang xuất thiệp ảnh HD...');
            const cardEl = document.getElementById('invitation-card');

            html2canvas(cardEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
                logging: false
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `Thiep_Moi_Tot_Nghiep_${appConfig.name.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                showToast('✅ Đã tải thiệp ảnh HD xuống thiết bị!');
            }).catch(err => {
                console.error(err);
                showToast('❌ Không thể xuất ảnh thiệp. Vui lòng thử lại.');
            });
        });
    }

    // --- 12. SHARE & QR CODE MODAL ---
    if (btnShareLink) {
        btnShareLink.addEventListener('click', () => {
            const currentUrl = window.location.href;
            const shareUrlInput = document.getElementById('share-url-input');
            const qrImg = document.getElementById('qr-code-img');

            if (shareUrlInput) shareUrlInput.value = currentUrl;
            if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;

            shareModal.classList.remove('hidden');
        });
    }

    const btnCloseShareModal = document.getElementById('btn-close-share-modal');
    if (btnCloseShareModal) {
        btnCloseShareModal.addEventListener('click', () => shareModal.classList.add('hidden'));
    }

    const btnCopyLink = document.getElementById('btn-copy-link');
    if (btnCopyLink) {
        btnCopyLink.addEventListener('click', () => {
            const shareUrlInput = document.getElementById('share-url-input');
            if (shareUrlInput) {
                navigator.clipboard.writeText(shareUrlInput.value);
                showToast('🔗 Đã copy đường link thiệp mời!');
            }
        });
    }

    // --- 13. MUSIC SYNTHESIZER (WEB AUDIO API) ---
    if (btnMusic) {
        btnMusic.addEventListener('click', () => toggleMusic());
    }

    function toggleMusic(forceState) {
        isMusicPlaying = forceState !== undefined ? forceState : !isMusicPlaying;
        document.body.classList.toggle('music-playing', isMusicPlaying);

        if (isMusicPlaying) {
            playAmbientChimes();
        } else {
            stopAmbientChimes();
        }
    }

    function playAmbientChimes() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C, E, G, C, E, G
            let step = 0;

            if (musicInterval) clearInterval(musicInterval);

            musicInterval = setInterval(() => {
                if (!isMusicPlaying) return;

                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                const freq = notes[step % notes.length];
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + 1.2);

                step++;
            }, 500);

        } catch (e) {
            console.log('Audio API unsupported or blocked');
        }
    }

    function stopAmbientChimes() {
        if (musicInterval) clearInterval(musicInterval);
    }

    // --- 14. CONFETTI & FIREWORKS ENGINE ---
    function triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#D4AF37', '#FFD700', '#FFFFFF', '#E8C39E', '#38BDF8', '#F43F5E'];

        for (let i = 0; i < 120; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 16,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        let animationFrame;
        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let activeParticles = 0;

            particles.forEach(p => {
                if (p.opacity <= 0) return;
                activeParticles++;

                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.25; // gravity
                p.rotation += p.rSpeed;
                p.opacity -= 0.012;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            });

            if (activeParticles > 0) {
                animationFrame = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        render();
    }

    // --- 15. UTILITIES & TOASTS ---
    function showToast(msg) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${escapeHtml(msg)}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }

    function getSampleRSVPs() {
        return [
            { id: 1, name: 'Trần Minh Hoàng', phone: '0901234567', guests: 2, attendance: 'attending', afterparty: 'yes', note: 'Chúc mừng An nhé! Hẹn gặp ở trường!', createdAt: '10/09/2026' },
            { id: 2, name: 'Lê Thị Thu Thảo', phone: '0988765432', guests: 1, attendance: 'attending', afterparty: 'yes', note: 'Siêu tự hào về An luôn! Chuẩn bị quà xịn rồi nha.', createdAt: '11/09/2026' }
        ];
    }

    function getSampleWishes() {
        return [
            { id: 1, author: 'Minh Hoàng', text: 'Chúc mừng Tân Cử Nhân xuất sắc! Chúc An bước sang chặng đường mới luôn gặt hái nhiều thành công rực rỡ nhé! 🚀', sticker: '🎓', time: '10:15 11/09/2026' },
            { id: 2, author: 'Thu Thảo', text: 'Tự hào về cậu thật sự. 4 năm nỗ lực đã được đền đáp xứng đáng rồi nè! 🎉🎉', sticker: '💐', time: '14:30 11/09/2026' },
            { id: 3, author: 'Nhóm Bạn Thân A4', text: 'Chúc An ra trường công việc thuận lợi, lương nghìn đô, vạn sự như ý nha bro! ⭐', sticker: '⭐', time: '16:45 11/09/2026' }
        ];
    }
});

// Scroll helper
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}
