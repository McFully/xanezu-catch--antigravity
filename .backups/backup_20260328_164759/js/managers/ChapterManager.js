export class ChapterManager {
    constructor(registry) {
        this.registry = registry || {};
        this.ids = Object.keys(this.registry).map(Number).sort((a, b) => a - b);
    }

    getById(id) {
        return this.registry[id] || null;
    }

    getAllIds() {
        return [...this.ids];
    }

    getTotal() {
        return this.ids.length;
    }
}
