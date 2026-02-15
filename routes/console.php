<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('rss:fetch')->everyFiveMinutes()->withoutOverlapping();
