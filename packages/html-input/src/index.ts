import { PluginContext, UniClientPlugin } from '@uni.js/client';
import Keyboard from 'keyboardjs';

export class Vector2{
	constructor(public x: number, public y: number) {}
}

export enum InputKey {
	UP = 'UP',
	DOWN = 'DOWN',
	LEFT = 'LEFT',
	RIGHT = 'RIGHT',

	W = 'W',
	A = 'A',
	D = 'D',
	S = 'S',

	E = 'E',
	J = 'J',
	Q = 'Q',
	R = 'R',

	NUM_1 = 'NUM_1',
	NUM_2 = 'NUM_2',
	NUM_3 = 'NUM_3',
	NUM_4 = 'NUM_4',
	NUM_5 = 'NUM_5',
	NUM_6 = 'NUM_6',
	NUM_7 = 'NUM_7',
	NUM_8 = 'NUM_8',
	NUM_9 = 'NUM_9',
	NUM_0 = 'NUM_0',
}

export interface InputProvider {
	keyPress(key: InputKey): boolean;
	keyDown(key: InputKey): boolean;
	cursorPress(): boolean;
	getCursorAt(): Vector2;
	doFixedUpdateTick(tick: number): void;
}

export class HTMLInputProvider implements InputProvider {
	private keysPressed = new Map<InputKey, boolean>();
	private keysDown = new Map<InputKey, boolean>();

	private cursorPressed = false;

	private actions: any = [];
	private tick = 0;
	private cursorAt = new Vector2(0, 0);
	private mouseElem: HTMLElement;

	private binded = false;

	constructor() {}

	bind(mouseElem: HTMLElement) {
		if (this.binded) return;
		this.binded = true;

		this.bindKey('up', InputKey.UP);
		this.bindKey('down', InputKey.DOWN);
		this.bindKey('left', InputKey.LEFT);
		this.bindKey('right', InputKey.RIGHT);

		this.bindKey('w', InputKey.W);
		this.bindKey('s', InputKey.S);
		this.bindKey('a', InputKey.A);
		this.bindKey('d', InputKey.D);

		this.bindKey('e', InputKey.E);
		this.bindKey('j', InputKey.J);
		this.bindKey('q', InputKey.Q);
		this.bindKey('r', InputKey.R);

		this.bindKey('1', InputKey.NUM_1);
		this.bindKey('2', InputKey.NUM_2);
		this.bindKey('3', InputKey.NUM_3);
		this.bindKey('4', InputKey.NUM_4);
		this.bindKey('5', InputKey.NUM_5);
		this.bindKey('6', InputKey.NUM_6);
		this.bindKey('7', InputKey.NUM_7);
		this.bindKey('8', InputKey.NUM_8);
		this.bindKey('9', InputKey.NUM_9);
		this.bindKey('0', InputKey.NUM_0);

		this.mouseElem = mouseElem;
		this.mouseElem.addEventListener('mousemove', this.onCursorMove.bind(this));
		this.mouseElem.addEventListener('mousedown', this.onCursorDown.bind(this));
		this.mouseElem.addEventListener('mouseup', this.onCursorUp.bind(this));
	}

	private onCursorMove(event: MouseEvent) {
		this.cursorAt = new Vector2(event.offsetX, event.offsetY);
	}

	private onCursorDown() {
		this.cursorPressed = true;
	}

	private onCursorUp() {
		this.cursorPressed = false;
	}

	private bindKey(keyName: string, inputKey: InputKey) {
		Keyboard.on(
			keyName,
			() => {
				this.keysPressed.set(inputKey, true);
			},
			() => {
				this.actions.push([this.tick + 1, () => this.keysPressed.set(inputKey, false)]);
			},
		);

		Keyboard.on(
			keyName,
			(event) => {
				event.preventRepeat();
				this.keysDown.set(inputKey, true);
				this.actions.push([this.tick + 1, () => this.keysDown.set(inputKey, false)]);
			},
			() => {},
		);
	}

	keyPress(key: InputKey): boolean {
		return Boolean(this.keysPressed.get(key));
	}

	keyDown(key: InputKey): boolean {
		return Boolean(this.keysDown.get(key));
	}

	cursorPress(): boolean {
		return this.cursorPressed;
	}

	getCursorAt() {
		return this.cursorAt;
	}

	private consumeActions() {
		const newActions = [];
		for (const action of this.actions) {
			const [tickAt, func] = action;
			if (tickAt != this.tick) newActions.push(action);
			else {
				func();
			}
		}
		this.actions = newActions;
	}

	doFixedUpdateTick(): void {
		this.consumeActions();
		this.tick++;
	}
}

export function HTMLInputPlugin() : UniClientPlugin {
	return function(context: PluginContext) {
		const app = context.app;
		const mouseElem = app.getCanvasContainer();
		
		const inputProvider = new HTMLInputProvider();
		inputProvider.bind(mouseElem);

		app.add(HTMLInputProvider, inputProvider)
		app.addTicker(() => inputProvider.doFixedUpdateTick());
	}
}