const Toast = {
  container: null,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(options = {}) {
    this.init();

    const {
      type = 'info',
      title = '',
      message = '',
      duration = 3000,
      closable = true
    } = options;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      ${closable ? '<button class="toast-close" aria-label="Close">×</button>' : ''}
      <div class="toast-progress"></div>
    `;

    this.container.appendChild(toast);

    // Close button handler
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.remove(toast));
    }

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    // Click toast to dismiss
    toast.addEventListener('click', (e) => {
      if (e.target !== toast.querySelector('.toast-close')) {
        this.remove(toast);
      }
    });

    return toast;
  },

  remove(toast) {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },

  success(message, title = 'Success') {
    return this.show({ type: 'success', title, message });
  },

  error(message, title = 'Error') {
    return this.show({ type: 'error', title, message, duration: 7000 });
  },

  warning(message, title = 'Warning') {
    return this.show({ type: 'warning', title, message });
  },

  info(message, title = '') {
    return this.show({ type: 'info', title, message });
  }
};

// Make Toast globally available
window.Toast = Toast;