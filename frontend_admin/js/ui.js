        /* ─────────────────────────────────────
           Theme Toggle
        ───────────────────────────────────── */
        function toggleTheme() {
            const html = document.documentElement;
            const isDark = html.getAttribute('data-theme') === 'dark';
            html.setAttribute('data-theme', isDark ? 'light' : 'dark');
            document.getElementById('themeIcon').className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }

        // Sistem renk tercihini uygula (ilk yükleme)
        (function applySystemTheme() {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            // İkon sayfa yüklendikten sonra ayarlanacak
            window.addEventListener('DOMContentLoaded', () => {
                const icon = document.getElementById('themeIcon');
                if (icon) icon.className = prefersDark ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
            });
            // OS'tan geçiş yapıldığında güncelle
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                const icon = document.getElementById('themeIcon');
                if (icon) icon.className = e.matches ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
            });
        })();


        /* ─────────────────────────────────────
           Toast
        ───────────────────────────────────── */
        function showToast(msg, type = 'success', duration = 3000) {
            const icons = { success: 'bi-check-circle-fill', warning: 'bi-exclamation-circle-fill', danger: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
            const container = document.getElementById('toastContainer');
            const el = document.createElement('div');
            el.className = `toast-item ${type}`;
            el.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i> ${msg}`;
            container.appendChild(el);
            setTimeout(() => {
                el.style.transition = 'opacity 0.3s, transform 0.3s';
                el.style.opacity = '0';
                el.style.transform = 'translateX(20px)';
                setTimeout(() => el.remove(), 350);
            }, duration);
        }


        /** Accordion aç/kapat */
        function toggleAccordion(panelId) {
            document.getElementById(panelId).classList.toggle('open');
        }

        /** View Değiştirme (Dashboard / Exam Builder) */
        function switchView(viewId, menuItem) {
            // Görünümleri gizle
            document.querySelectorAll('.view-section').forEach(view => {
                view.style.display = 'none';
            });
            
            // Seçilen görünümü göster
            const activeView = document.getElementById(viewId);
            if (activeView) {
                activeView.style.display = 'block';
            }
            
            // Menü aktifliğini ayarla
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });
            if (menuItem) {
                menuItem.classList.add('active');
            }
        }
