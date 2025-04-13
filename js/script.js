/*
1. Они должны работать по клику
2. Они должны работать с клавиатуры (причем правильно - через клавиши стрелочек)
3. Нужно событие изменения, чтобы делать какие-то действия в момент переключения табов
4. Нужно событие переключения таба в любой момент времени
5. Проверки на различные условия, чтобы плагин корректно работал

*/


const tabsBtn = document.querySelector("[data-tabs]");
// console.log(tabsBtn);
if (tabsBtn) {
    class GraphTabs {
        constructor(selector, options) {
            let defaultOptions = {
                isChanged: () => {
                }
            }
            this.options = Object.assign(defaultOptions, options);
            this.selector = selector;
            this.tabs = document.querySelector(`[data-tabs="${selector}"]`);
            if (this.tabs) {
                this.tabList = this.tabs.querySelector('.products__body-btn-box');
                this.tabsBtns = this.tabList.querySelectorAll('.products__body-btn');
                this.tabsPanels = this.tabs.querySelectorAll('.tabs__panel');
            } else {
                console.error('Селектор data-tabs не существует!');
                return;
            }

            this.check();
            this.init();
            this.events();
        }

        check() {
            if (document.querySelectorAll(`[data-tabs="${this.selector}"]`).length > 1) {
                console.error('Количество элементов с одинаковым data-tabs больше одного!');
                return;
            }

            if (this.tabsBtns.length !== this.tabsPanels.length) {
                console.error('Количество кнопок и элементов табов не совпадает!');
                return;
            }
        }

        init() {
            this.tabList.setAttribute('role', 'tablist');

            this.tabsBtns.forEach((el, i) => {
                el.setAttribute('role', 'tab');
                el.setAttribute('tabindex', '-1');
                el.setAttribute('id', `${this.selector}${i + 1}`);
                el.classList.remove('tabs__nav-btn--active');
            });

            this.tabsPanels.forEach((el, i) => {
                el.setAttribute('role', 'tabpanel');
                el.setAttribute('tabindex', '-1');
                el.setAttribute('aria-labelledby', this.tabsBtns[i].id);
                el.classList.remove('tabs__panel--active');
            });

            this.tabsBtns[0].classList.add('tabs__nav-btn--active');
            this.tabsBtns[0].removeAttribute('tabindex');
            this.tabsBtns[0].setAttribute('aria-selected', 'true');
            this.tabsPanels[0].classList.add('tabs__panel--active');
        }

        events() {
            this.tabsBtns.forEach((el, i) => {
                el.addEventListener('click', (e) => {
                    let currentTab = this.tabList.querySelector('[aria-selected]');

                    if (e.currentTarget !== currentTab) {
                        this.switchTabs(e.currentTarget, currentTab);
                    }
                });
            });
        }

        switchTabs(newTab, oldTab = this.tabs.querySelector('[aria-selected]')) {
            // newTab.focus();
            newTab.removeAttribute('tabindex');
            newTab.setAttribute('aria-selected', 'true');

            oldTab.removeAttribute('aria-selected');
            oldTab.setAttribute('tabindex', '-1');

            let index = Array.prototype.indexOf.call(this.tabsBtns, newTab);
            let oldIndex = Array.prototype.indexOf.call(this.tabsBtns, oldTab);

            this.tabsPanels[oldIndex].classList.remove('tabs__panel--active');
            this.tabsPanels[index].classList.add('tabs__panel--active');

            this.tabsBtns[oldIndex].classList.remove('tabs__nav-btn--active');
            this.tabsBtns[index].classList.add('tabs__nav-btn--active');

            this.options.isChanged(this);
        }
    }



    const tabs1 = new GraphTabs('tab', {
        isChanged: (tabs) => {
            // console.log(tabs);
        }
    });
    
    tabs1.switchTabs(document.querySelector('#tab2'));
}
