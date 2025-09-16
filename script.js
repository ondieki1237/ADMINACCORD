// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links and content sections
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    // Add click event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get target section and show it
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // Simulate live data updates for dashboard stats
    function updateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        if (statNumbers.length > 0) {
            // Update user count with small random changes
            const userCount = statNumbers[0];
            const currentUsers = parseInt(userCount.textContent.replace(',', ''));
            const newUsers = currentUsers + Math.floor(Math.random() * 10) - 5;
            userCount.textContent = newUsers.toLocaleString();

            // Update active sessions
            const activeSessions = statNumbers[1];
            const currentSessions = parseInt(activeSessions.textContent);
            const newSessions = Math.max(0, currentSessions + Math.floor(Math.random() * 20) - 10);
            activeSessions.textContent = newSessions.toString();
        }
    }

    // Update stats every 30 seconds
    setInterval(updateStats, 30000);

    // Add button click handlers
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const buttonText = this.textContent;
            
            // Simple feedback for button clicks
            const originalText = this.textContent;
            this.textContent = 'Processing...';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
                
                // Show a simple notification
                showNotification(`${buttonText} action completed successfully!`);
            }, 1500);
        });
    });

    // Simple notification system
    function showNotification(message) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
            
            // Add notification styles
            const style = document.createElement('style');
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: #27ae60;
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                    z-index: 1000;
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                }
                .notification.show {
                    transform: translateX(0);
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.textContent = message;
        notification.classList.add('show');
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Welcome message
    console.log('ADMINACCORD Dashboard loaded successfully!');
    console.log('Made by Seth Makori');
});