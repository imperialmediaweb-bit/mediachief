<?php

/**
 * Theme globals class
 * Here we store the global state of the theme. All globals are here
 */
class tagdiv_global {

	/**
	 * theme plugins
	 * 'PLUGIN_CONSTANT' => 'hash'
	 * @var array
	 */
	private static $td_plugins = array(
		'TD_COMPOSER'       => array( 'version' => '3833ae26cf1f9d406448012ce1734aa1',         'class' => 'tdc_version_check' ),
		'TD_CLOUD_LIBRARY'  => array( 'version' => '34c58173fa732974ccb0ca4df5ede162',    'class' => 'tdb_version_check' ),
		'TD_SOCIAL_COUNTER' => array( 'version' => '2ed7fe863d425d73a6ed286703ee234b',   'class' => 'td_social_counter_plugin' ),
		'TD_NEWSLETTER'     => array( 'version' => '34a5749be48de23015036cdfbdca02e1',       'class' => 'td_newsletter_version_check' ),
		'TD_SUBSCRIPTION'   => array( 'version' => '___td-subscription___',     'class' => 'tds_version_check' ),
		'TD_MOBILE_PLUGIN'  => array( 'version' => 'cd46972e145ee7f8326f48bd537ad46c',    'class' => 'td_mobile_theme' ),
		'AMP'               => array( 'version' => '___amp___',                 'class' => 'AMP_Autoloader' ),
		'TD_STANDARD_PACK'  => array( 'version' => '9c79b36358200da4c4662c5aa9454675',    'class' => 'tdsp_version_check' ),
		'TD_WOO'            => array( 'version' => 'aca8f30bca350fed3ace35e8584ec1dd',              'class' => 'td_woo_version_check' )
	);


	/**
	 * Get the $td_plugins hashes array
	 * @return array
	 */
	static function get_td_plugins() {
		return self::$td_plugins;
	}

	/**
	 * set below with either http or https string
	 * @var string
	 */
    static $http_or_https = 'http';

	/**
	 * Determines if SSL is used and sets the $http_or_https global
	 */
    static function set_http_or_https() {
	    if ( is_ssl() ) {
		    self::$http_or_https = 'https';
	    }
    }

	/**
	 * the plugins that are installable via the theme > plugins panel & tgma
	 * @var array
	 */
    static $theme_plugins_list = array();

	/**
	 * the plugins that are just for information proposes
	 * @var array
	 */
	static $theme_plugins_for_info_list = array();


    /**
     * the js files that are used in wp-admin
     * @var array
     *
     * @todo check what js files are needed for wp admin
     */
    static $js_files_for_wp_admin = array (
        'td_wp_admin'     => '/includes/wp-booster/wp-admin/js/td_wp_admin.js',
        'td_edit_page'    => '/includes/wp-booster/wp-admin/js/td_edit_page.js',
        'td_page_options' => '/includes/wp-booster/wp-admin/js/td_page_options.js',
        'td_tooltip'      => '/includes/wp-booster/wp-admin/js/tooltip.js',
	    'td_confirm'      => '/includes/wp-booster/wp-admin/js/tdConfirm.js',
    );

}

/**
 * set http or https
 */
tagdiv_global::set_http_or_https();


