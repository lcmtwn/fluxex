var React = require('react'),
    Fluxex = require('fluxex'),
    apis = require('../actions/api'),

Results = React.createClass({
    mixins: [
        Fluxex.mixin,
        require('fluxex/extra/storechange'),
        {listenStores: ['search']}
    ],

    componentDidMount: function() {
        /*global window,document*/
        window.addEventListener('scroll', this.handleScroll, false);
    },

    componentWillUnmount: function() {
        window.removeEventListener('scroll', this.handleScroll, false);
    },

    getStateFromStores: function () {
        return this.getStore('search').getSearchData();
    },

    handleScroll: function () {
        var ie8;

        if (this.state.appending) {
            return;
        }

        if (window.pageYOffset === undefined) {
            ie8 = window.document.documentElement;
        }

        if ((ie8 ? ie8.scrollTop : window.pageYOffset) + (ie8 ? ie8.clientHeight : window.innerHeight) * 3 > document.body.offsetHeight) {
            this.executeAction(apis.load_more);
        }
    },

    render: function () {
        var videos = [],
            all = this.state.videos ? this.state.videos.length : 0;

        if (!all) {
            return (
               <h1>Search keyword: '{this.state.keyword}' not found!</h1>
            );
        }

        videos = this.state.videos.map(function (V) {
            var img,
                sec = <span key="0">{V.duration+' seconds'}</span>;

            if (V.thumbnails && V.thumbnails.thumbnail && V.thumbnails.thumbnail[0]) {
                img = <img key="1" src={V.thumbnails.thumbnail[0].content}/>;
            }

            return (
            <li key={V.id}>
             <h5><a href={V.url}>{V.title}</a></h5>
             <a href={V.url}>{[img, sec]}</a>
            </li>
            );
        });

        return (
        <div>
         <h1>Search keyword: '{this.state.keyword}'</h1>
         <ul>{videos}</ul>
        </div>
        );
    }
});

module.exports = Results;
