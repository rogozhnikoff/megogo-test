steal(
  // фреймворк
  "jquery",
  "jquery/controller",
  "jquery/view",
  "jquery/view/ejs",
  "jquery/event/key"
).then(
    // дополнительные библиотеки
    "steal/less",
    "mylibs/underscore",
    "mylibs/easing",
    "mylibs/mousewheel"
  ).then(function ($) {
    $.Controller('Scroller', {
      defaults: {
        activated: false,
        duration: 180,
        inLoad: false,
        fullHeight: 100
      }
    }, {
      init: function (el, opt) {
        // включаем бар загрузки
        this.list = $('.scroller__list', el).addClass('is-load is-load_center');
        // скачиваем фотки (сама работа с апи на уровне nodejs - app.js в корн проекта)
        $.getJSON('/flickr/getPhotos/50', this.callback('start'));
      },
      start: function (data) {
        // вставляем фотки
        this.list.removeClass('is-load is-load_center').append('scroller__item', {photos: _(data).shuffle()});
        // выбираем крайнюю левую в среднем ряду
        this.setCurrent((50 / 2) - 5);
        // включаем отслеживание скролла
        this.setScroll();
        // отмечаемся, что уже активировались
        this.options.activated = true;
      },


      // отслеживать onscroll нельзя, потому-что его не овверайднуть
      // при mousewheel есть проблема - он создает множество событий из-за затухания,
      // это вызывает "дублирование" нашего скролла, т.к. мы не знаем, какова их длительность,
      // ведь настройки на компьютерах юзверей разные. вот поэтому метод слегка через ягодицы
      setScroll: function () {
        // отвязываем блокирующий лисенер
        this.element.unmousewheel();

        // вешаем основной
        this.element.mousewheel(_.bind(function (ev, delta) {
          // сразу же отвязываем его
          this.element.unmousewheel();

          // запускаем визуальный скролл списка
          (delta > 0)
            ? this.setCurrent(this.current.index() - 5)
            : this.setCurrent(this.current.index() + 5);

          // создаем таймаут вне блокирующего лисенера
          var timeout;

          // лисенер тупо перезапускает таймаут и ждет остановки в 100 мс
          this.element.mousewheel(_.bind(function () {
            clearTimeout(timeout);
            timeout = setTimeout(this.callback('setScroll'), 100);
          }, this));
        }, this));
      },
      "{window} mousewheel": function (el, ev) {
        // блокируем скролл окна, если курсор в блоке
        if ($(ev.target).closest('.scroller').length) ev.preventDefault();
      },
      "{window} keydown": function (el, ev) {
        // проверяем, нажали ли нужные нам клавиши
        if (this.options.activated && _(['up', 'right', 'down', 'left']).any(function (key) {
          return key === ev.keyName()
        })) {
          var increment = 0;

          switch (ev.keyName()) {
            case 'up':
            {
              increment = -5;
              break;
            }
            case 'right':
            {
              increment = 1;
              break;
            }
            case 'down':
            {
              increment = 5;
              break;
            }
            case 'left':
            {
              increment = -1;
              break;
            }
          }

          this.setCurrent(this.current.index() + increment);
        }
      },
      setCurrent: function (index) {
        index = index || 0;
        var el = $('.scroller__item:eq(' + index + ')', this.element);

        // вообще было бы неплохо в моделях держать данные, но это излишество
        if (el.length) {
          // удаляем активный класс у прошлой картинки
          if (this.current) this.current.removeClass('is-current');
          // определяем текущую картинку
          this.current = el.addClass('is-current');
          // двигаем листик в ее сторону
          this.list.animate({top: (this.current.position().top - this.options.fullHeight) * -1});

          // проверяем на переход к предпоследнему ряду, чтобы запустить загрузку новых фото
          if (this.current.index() <= 9) {
            this.reload('up');
          } else if (this.current.index() >= $('.scroller__item', this.element).length - 10) {
            this.reload('down');
          }
        }
      },
      reload: function (dir) {
        if (!this.options.inLoad) {
          // чтобы не срабатывало по 2 раза, замораживаем функцию
          this.options.inLoad = true;

          // показываем бар загрузки
          this.list.addClass('is-load is-load_' + dir);

          // загружаем
          $.getJSON('/flickr/getPhotos/40', _.bind(function (data) {
            // выключаем бар загрузки
            this.list.removeClass('is-load is-load_' + dir);
            // вставляем фотки
            this.list[(dir === 'up') ? 'prepend' : 'append']('scroller__item', {photos: _(data).shuffle()});
            // чистим от лишнего
            this.cleanGarbage(dir);
            // смещаем, чтобы не прыгало
            this.list.css({top: (this.current.position().top - this.options.fullHeight) * -1});
            // отмораживаем функцию
            this.options.inLoad = false;
          }, this));
        }
      },
      cleanGarbage: function (dir) {
        // удаляем устаревшее (не должно быть более 50)
        if (dir === 'up') {
          $('.scroller__item', this.element).each(function (i) {
            if (i >= 50) $(this).remove();
          });
        } else if (dir === 'down') {
          var length = $('.scroller__item', this.element).length;

          $('.scroller__item', this.element).each(function (i) {
            if (i < length - 50) $(this).remove();
          });
        }
      }
    });

    $(function () {
      // т.к. единого инициализирующего файла нету, то вставляем прямо тут
      $('.scroller').scroller({});
    });
  }
);