class Event {
    constructor(name, points) {
        this.name = name;
        this.points = points.map(point => ({ ...point, event: name })); // Add event name to each point
        this.points.sort((a, b) => b.points - a.points); // Sort in descending order by points
    }
    getName() {
        return this.name;
    }
    getTopPoints(count) {
        return this.points.slice(0, count);
    }
    getSumOfTopPoints(count) {
        return this.getTopPoints(count).reduce((sum, entry) => sum + entry.points, 0);
    }
}

class PointsCalculator {
    constructor(pointsData) {
        this.events = [];
        this.jumpEvent = null;
        for (const [event, pointsList] of Object.entries(pointsData)) {
            if (event === 'hüpe') {
                this.jumpEvent = new Event(event, pointsList);
            } else {
                this.events.push(new Event(event, pointsList));
            }
        }
    }

    calculateMaxTotalPoints() {
        if (!this.events.length) {
            console.error('No events data available');
            return { totalPoints: 0, detailedPoints: [] };
        }
        this.events.sort((a, b) => b.getSumOfTopPoints(3) - a.getSumOfTopPoints(3));
        const selectedPoints = [];
        if (this.events[0]) selectedPoints.push(...this.events[0].getTopPoints(3));
        if (this.events.length > 1) selectedPoints.push(...this.getRemainingTopPoints(2, [this.events[0].getName()]));
        if (this.events.length > 2) selectedPoints.push(...this.getRemainingTopPoints(1, [this.events[0].getName(), this.events[1].getName()]));
        if (this.jumpEvent) selectedPoints.push(...this.jumpEvent.getTopPoints(2));
        else console.warn('Jump event (hüpe) data is missing');
        const totalPoints = selectedPoints.reduce((sum, entry) => sum + entry.points, 0);
        return {
            totalPoints,
            detailedPoints: selectedPoints.map(entry => ({ event: entry.event, points: entry.points, meters: entry.meters }))
        };
    }

    getRemainingTopPoints(count, excludedEvents) {
        const remainingEvents = this.events.filter(event => !excludedEvents.includes(event.getName()));
        if (!remainingEvents.length) {
            console.warn('No remaining events available for top points calculation');
            return [];
        }
        remainingEvents.sort((a, b) => b.getSumOfTopPoints(count) - a.getSumOfTopPoints(count));
        return remainingEvents[0].getTopPoints(count);
    }
}

module.exports = PointsCalculator;

