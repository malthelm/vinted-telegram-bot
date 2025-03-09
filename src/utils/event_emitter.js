/**
 * Simple event emitter for handling application events.
 */
class EventEmitter {
    /**
     * Constructor for EventEmitter.
     */
    constructor() {
        this.events = {};
    }

    /**
     * Register an event listener.
     * @param {string} event - The event name.
     * @param {Function} listener - The event listener function.
     * @returns {EventEmitter} The EventEmitter instance.
     */
    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
    }

    /**
     * Remove an event listener.
     * @param {string} event - The event name.
     * @param {Function} listener - The event listener function to remove.
     * @returns {EventEmitter} The EventEmitter instance.
     */
    off(event, listener) {
        if (!this.events[event]) {
            return this;
        }
        this.events[event] = this.events[event].filter(l => l !== listener);
        return this;
    }

    /**
     * Emit an event.
     * @param {string} event - The event name.
     * @param {...any} args - Arguments to pass to the listeners.
     * @returns {boolean} True if the event had listeners, false otherwise.
     */
    emit(event, ...args) {
        if (!this.events[event]) {
            return false;
        }
        this.events[event].forEach(listener => {
            listener(...args);
        });
        return true;
    }

    /**
     * Register a one-time event listener.
     * @param {string} event - The event name.
     * @param {Function} listener - The event listener function.
     * @returns {EventEmitter} The EventEmitter instance.
     */
    once(event, listener) {
        const onceWrapper = (...args) => {
            listener(...args);
            this.off(event, onceWrapper);
        };
        return this.on(event, onceWrapper);
    }
}

export default EventEmitter; 