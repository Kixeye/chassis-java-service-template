<?php

	class UserReport {
		
		protected $dataStore;
		
		public function __construct( $data_store ) {
			$this->dataStore = $data_store;
		}
		
		public function summary() {
			$query = 'SELECT'
				.' COUNT( users.ID ) AS totalPlayers,'
				.' SUM( CASE WHEN users.lastPlayed = ? THEN 1 ELSE 0 END ) AS totalPlayedToday'
				.' FROM users'
				.' WHERE 1';
			return $this->dataStore->queryRowPrepared( $query, array( date( 'Y-m-d' ) ) );
		}
		
		public function topHighScores() {
			$query =  $this->dataStore->limitQuery( 'SELECT'
				.' users.facebookID,'
				.' MAX( userScores.score ) AS topScore'
				.' FROM users'
				.' LEFT JOIN userScores ON users.facebookID = userScores.userFacebookID'
				.' WHERE 1'
				.' GROUP BY users.facebookID'
				.' ORDER BY topScore DESC', 10 );
			return $this->dataStore->queryPrepared( $query, array() );
		}
		
		public function topImprovedScores() {
			$query = $this->dataStore->limitQuery( 'SELECT'
				.' users.facebookID,'
				.' MAX( CASE WHEN userScores.date > ? AND userScores.date <= ? THEN userScores.score ELSE 0 END ) AS thisWeeksTopScore,'
				.' MAX( CASE WHEN userScores.date > ? AND userScores.date <= ? THEN userScores.score ELSE 0 END ) AS lastWeeksTopScore,'
				.' MAX( CASE WHEN userScores.date > ? AND userScores.date <= ? THEN userScores.score ELSE 0 END ) - MAX( CASE WHEN userScores.date BETWEEN ? AND ? THEN userScores.score ELSE 0 END ) AS topScoreImprovement'
				.' FROM users'
				.' LEFT JOIN userScores ON users.facebookID = userScores.userFacebookID'
				.' WHERE 1'
				.' GROUP BY users.facebookID'
				.' ORDER BY topScoreImprovement DESC', 10 );
			$this_sunday = strtotime( 'this sunday' );
			$one_week_ago_this_sunday = strtotime( '-1 week', $this_sunday );
			$two_weeks_ago_this_sunday = strtotime( '-2 weeks', $this_sunday );
			$this_sunday = date( 'Y-m-d', $this_sunday );
			$one_week_ago_this_sunday = date( 'Y-m-d', $one_week_ago_this_sunday );
			$two_weeks_ago_this_sunday = date( 'Y-m-d', $two_weeks_ago_this_sunday );
			return $this->dataStore->queryPrepared( $query, array(
				$one_week_ago_this_sunday,
				$this_sunday,
				$two_weeks_ago_this_sunday,
				$one_week_ago_this_sunday,
				$one_week_ago_this_sunday,
				$this_sunday,
				$two_weeks_ago_this_sunday,
				$one_week_ago_this_sunday
			) );
		}
	}
	[swf file="cameraFeed" stream="rtmp://server/live" action="swftools_flv_display" live="true" player="flowplayer3_mediaplayer"]
?>
