import { AppObservableService } from "Library/Utilities/Context";

export abstract class BaseDataService<TCollection, TItem, TKey> extends AppObservableService<void> {
    protected items: TCollection;

    private _isLoading: boolean;
    private _isItemLoadingMap: IDictionaryStringTo<boolean>;

    constructor() {
        super();
        this.items = null;
        this._isLoading = false;
        this._isItemLoadingMap = {};
    }

    public isLoaded(key?: TKey): boolean {
        let dataLoaded: boolean;
        if (key) {
            dataLoaded = this.itemExists(key);
        }
        else {
            dataLoaded = this.items != null ? true : false;
        }

        return dataLoaded && !this.isLoading(key);
    }

    public isLoading(key?: TKey): boolean {
        if (key) {
            return this._isLoading || this._isItemLoadingMap[this.convertItemKeyToString(key)] === true;
        }
        else {
            return this._isLoading;
        }
    }

    public setLoading(loading: boolean, key?: TKey) {
        if (key) {
            if (loading) {
                this._isItemLoadingMap[this.convertItemKeyToString(key)] = true;
            }
            else {
                delete this._isItemLoadingMap[this.convertItemKeyToString(key)];
            }
        }
        else {
            this._isLoading = loading;
        }

        this.emitChanged();
    }

    public itemExists(key: TKey): boolean {
        return this.getItem(key) != null ? true : false;
    }

    public getAll(): TCollection {
        return this.items;
    }

    public addChangedListener(listener: () => void) {
        this.subscribe(listener);
    }

    public removeChangedListener(listener: () => void) {
        this.unsubscribe(listener);
    }

    public abstract getItem(key: TKey): TItem;
    public abstract getKey(): string;

    protected emitChanged() {
        this.notify(null, null);
    }

    protected abstract convertItemKeyToString(key: TKey): string;
}
